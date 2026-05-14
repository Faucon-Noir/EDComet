import path from "path";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";

type JsonSchema = {
	$ref?: string;
	title?: string;
	description?: string;
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	enum?: Array<string | number | boolean | null>;
	const?: string | number | boolean | null;
	allOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	extends?: JsonSchema;
	definitions?: Record<string, JsonSchema>;
	additionalProperties?: boolean | JsonSchema;
};

type GenerationArgs = {
	outputDir: string;
};

type ResolveContext = {
	currentSchemaPath: string;
	stack: string[];
	currentTypeName: string;
	declarationState: DeclarationState;
};

type DeclarationState = {
	declarations: string[];
	declaredTypeNames: Set<string>;
	imports: Map<string, Set<string>>;
};

type ObjectShape = {
	properties: Map<string, JsonSchema>;
	required: Set<string>;
};

type ResolvedReference = {
	fragment?: string;
	resolvedSchema: JsonSchema;
	schemaPath: string;
};

const SCHEMA_ROOT = "schemas/";
const LOCAL_SCHEMA_DIR = path.resolve(process.cwd(), "../shared/schemas");
const DEFAULT_OUTPUT_DIR = path.resolve(
	process.cwd(),
	"../shared/types/generated/jixxed"
);

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const schemaPaths = await fetchSchemaPaths();
	const schemaMap = await fetchSchemas(schemaPaths);

	await mkdir(args.outputDir, { recursive: true });

	const indexExports: string[] = [];

	for (const schemaPath of schemaPaths) {
		const schema = schemaMap.get(schemaPath);
		if (!schema) {
			throw new Error(`Schema not loaded: ${schemaPath}`);
		}

		const relativeOutputPath = buildOutputPath(schemaPath);
		const absoluteOutputPath = path.join(args.outputDir, relativeOutputPath);
		const fileContent = buildTypeFile(schemaPath, schema, schemaMap);

		await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
		await writeFile(absoluteOutputPath, fileContent, "utf8");

		indexExports.push(
			buildIndexExport(schemaPath, relativeOutputPath)
		);
	}

	await writeFile(
		path.join(args.outputDir, "index.ts"),
		`${indexExports.sort().join("\n")}\n`,
		"utf8"
	);

	console.log(`Generated ${schemaPaths.length} schema type files in ${args.outputDir}`);
}

function parseArgs(argv: string[]): GenerationArgs {
	const args: GenerationArgs = {
		outputDir: DEFAULT_OUTPUT_DIR,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--output") {
			const outputDir = argv[index + 1];
			if (!outputDir) {
				throw new Error("Missing value for --output");
			}
			args.outputDir = path.resolve(process.cwd(), outputDir);
			index += 1;
			continue;
		}

	}

	return args;
}

async function fetchSchemaPaths(): Promise<string[]> {
	return collectSchemaPaths(LOCAL_SCHEMA_DIR);
}

async function fetchSchemas(schemaPaths: string[]): Promise<Map<string, JsonSchema>> {
	const schemaMap = new Map<string, JsonSchema>();

	for (const schemaPath of schemaPaths) {
		const absoluteSchemaPath = path.resolve(
			LOCAL_SCHEMA_DIR,
			schemaPath.slice(SCHEMA_ROOT.length)
		);
		const schemaContent = await readFile(absoluteSchemaPath, "utf8");
		schemaMap.set(schemaPath, JSON.parse(schemaContent) as JsonSchema);
	}

	return schemaMap;
}

async function collectSchemaPaths(rootDir: string, currentDir = rootDir): Promise<string[]> {
	const directoryEntries = await readdir(currentDir, { withFileTypes: true });
	const schemaPaths: string[] = [];

	for (const entry of directoryEntries.sort((left, right) => left.name.localeCompare(right.name))) {
		const absoluteEntryPath = path.join(currentDir, entry.name);

		if (entry.isDirectory()) {
			schemaPaths.push(...(await collectSchemaPaths(rootDir, absoluteEntryPath)));
			continue;
		}

		if (!entry.isFile() || !entry.name.endsWith(".json")) {
			continue;
		}

		const relativeSchemaPath = path.relative(rootDir, absoluteEntryPath).replace(/\\/g, "/");
		schemaPaths.push(`${SCHEMA_ROOT}${relativeSchemaPath}`);
	}

	return schemaPaths;
}

function buildTypeFile(
	schemaPath: string,
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>
): string {
	const fileTypeName = toTypeName(path.basename(schemaPath, ".json"));
	const declarations: string[] = [];
	const declarationState: DeclarationState = {
		declarations,
		declaredTypeNames: new Set<string>(),
		imports: new Map<string, Set<string>>(),
	};

	if (shouldGenerateRootDeclaration(schema)) {
		declarations.push(
			...buildDeclaration(fileTypeName, schema, schemaPath, schemaMap, declarationState)
		);
	}

	for (const [definitionName, definitionSchema] of Object.entries(schema.definitions ?? {})) {
		const declarationName = `${fileTypeName}${toTypeName(definitionName)}`;
		declarations.push(
			...buildDeclaration(
				declarationName,
				definitionSchema,
				schemaPath,
				schemaMap,
				declarationState
			)
		);
	}

	if (declarations.length === 0) {
		declarations.push(`export type ${fileTypeName} = unknown;`);
	}

	const importLines = Array.from(declarationState.imports.entries())
		.sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
		.map(([importPath, typeNames]) => {
			const sortedTypeNames = Array.from(typeNames).sort();
			return `import type { ${sortedTypeNames.join(", ")} } from "${importPath}";`;
		});

	return [
		"/* eslint-disable */",
		"// Generated from jixxed/ed-journal-schemas. Regenerate instead of editing manually.",
		"",
		...importLines,
		...(importLines.length > 0 ? [""] : []),
		...declarations,
		"",
	].join("\n");
}

function shouldGenerateRootDeclaration(schema: JsonSchema): boolean {
	return Boolean(
		schema.properties ||
			schema.allOf?.length ||
			schema.anyOf?.length ||
			schema.oneOf?.length ||
			schema.enum?.length ||
			schema.const !== undefined ||
			schema.items ||
			schema.type
	);
}

function buildDeclaration(
	name: string,
	schema: JsonSchema,
	schemaPath: string,
	schemaMap: Map<string, JsonSchema>,
	declarationState: DeclarationState
): string[] {
	const nestedDeclarations: string[] = [];
	const localDeclarationState: DeclarationState = {
		declarations: nestedDeclarations,
		declaredTypeNames: declarationState.declaredTypeNames,
		imports: declarationState.imports,
	};

	if (isObjectLike(schema, schemaPath, schemaMap)) {
		localDeclarationState.declaredTypeNames.add(name);
		const interfaceDeclaration = renderInterfaceDeclaration(name, schema, schemaMap, {
			currentSchemaPath: schemaPath,
			stack: [],
			currentTypeName: name,
			declarationState: localDeclarationState,
		});
		return [
			...nestedDeclarations,
			interfaceDeclaration,
		];
	}

	const typeExpression = renderType(
		schema,
		schemaMap,
		{
			currentSchemaPath: schemaPath,
			stack: [],
			currentTypeName: name,
			declarationState: localDeclarationState,
		}
	);

	localDeclarationState.declaredTypeNames.add(name);
	return [...nestedDeclarations, `export type ${name} = ${typeExpression};`];
}

function isObjectLike(
	schema: JsonSchema,
	schemaPath: string,
	schemaMap: Map<string, JsonSchema>
): boolean {
	const shape = collectObjectShape(schema, schemaPath, schemaMap, []);
	if (shape.properties.size > 0) {
		return true;
	}

	const explicitTypes = normalizeTypeList(schema.type);
	return explicitTypes.includes("object") && !schema.items;
}

function renderType(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string {
	const directReferenceType = getDirectReferenceTypeName(schema, schemaMap, context);
	if (directReferenceType) {
		return directReferenceType;
	}

	const resolvedSchema = dereferenceSchema(schema, schemaMap, context);

	if (resolvedSchema.const !== undefined) {
		return renderLiteral(resolvedSchema.const);
	}

	if (resolvedSchema.enum && resolvedSchema.enum.length > 0) {
		return resolvedSchema.enum.map(renderLiteral).join(" | ");
	}

	if (resolvedSchema.oneOf && resolvedSchema.oneOf.length > 0) {
		return joinUnion(
			resolvedSchema.oneOf.map((option, index) =>
				renderType(option, schemaMap, {
					...context,
					currentTypeName: `${context.currentTypeName}Option${index + 1}`,
				})
			)
		);
	}

	if (resolvedSchema.anyOf && resolvedSchema.anyOf.length > 0) {
		return joinUnion(
			resolvedSchema.anyOf.map((option, index) =>
				renderType(option, schemaMap, {
					...context,
					currentTypeName: `${context.currentTypeName}Variant${index + 1}`,
				})
			)
		);
	}

	const explicitTypes = normalizeTypeList(resolvedSchema.type);
	const renderedTypes: string[] = [];

	if (shouldRenderAsObject(resolvedSchema)) {
		renderedTypes.push(renderNamedObjectType(resolvedSchema, schemaMap, context));
	}

	if (resolvedSchema.items || explicitTypes.includes("array")) {
		const itemType = resolvedSchema.items
			? renderType(resolvedSchema.items, schemaMap, {
				...context,
				currentTypeName: `${context.currentTypeName}Item`,
			})
			: "unknown";
		renderedTypes.push(`${wrapForArray(itemType)}[]`);
	}

	for (const explicitType of explicitTypes) {
		const primitiveType = mapPrimitiveType(explicitType);
		if (primitiveType) {
			renderedTypes.push(primitiveType);
		}
	}

	if (renderedTypes.length === 0 && resolvedSchema.allOf && resolvedSchema.allOf.length > 0) {
		renderedTypes.push(
			joinIntersection(
				resolvedSchema.allOf.map((entry, index) =>
					renderType(entry, schemaMap, {
						...context,
						currentTypeName: `${context.currentTypeName}Part${index + 1}`,
					})
				)
			)
		);
	}

	if (renderedTypes.length === 0) {
		return "unknown";
	}

	return joinUnion(renderedTypes);
}

function shouldRenderAsObject(schema: JsonSchema): boolean {
	return Boolean(
		schema.properties ||
			schema.allOf?.length ||
			schema.extends ||
			normalizeTypeList(schema.type).includes("object")
	);
}

function renderObjectType(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string {
	const shape = collectOwnObjectShape(schema);
	if (shape.properties.size === 0) {
		return "{ [key: string]: unknown }";
	}

	const lines = Array.from(shape.properties.entries()).map(([propertyName, propertySchema]) => {
		const propertyType = renderType(propertySchema, schemaMap, {
			...context,
			currentTypeName: buildNestedTypeName(context.currentTypeName, propertyName),
		});
		const safePropertyName = toPropertyName(propertyName);
		const optionalMarker = shape.required.has(propertyName) ? "" : "?";
		return `\t${safePropertyName}${optionalMarker}: ${propertyType};`;
	});

	return ["{", ...lines, "}"].join("\n");
}

function renderInterfaceDeclaration(
	name: string,
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string {
	const interfaceExtends = collectInterfaceExtends(schema, schemaMap, context);
	const extendsClause = interfaceExtends.length > 0
		? ` extends ${interfaceExtends.join(", ")}`
		: "";
	return `export interface ${name}${extendsClause} ${renderObjectType(schema, schemaMap, context)}`;
}

function renderNamedObjectType(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string {
	const { currentTypeName, declarationState } = context;
	if (!declarationState.declaredTypeNames.has(currentTypeName)) {
		declarationState.declaredTypeNames.add(currentTypeName);
		declarationState.declarations.push(
			renderInterfaceDeclaration(currentTypeName, schema, schemaMap, context)
		);
	}

	return currentTypeName;
}

function collectInterfaceExtends(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string[] {
	const inheritedEntries = [
		...(schema.extends ? [schema.extends] : []),
		...(schema.allOf ?? []),
	];
	const interfaceExtends = new Set<string>();

	inheritedEntries.forEach((entrySchema, index) => {
		const inheritedTypeName = renderInheritedType(entrySchema, schemaMap, {
			...context,
			currentTypeName: `${context.currentTypeName}Base${index + 1}`,
		});
		if (inheritedTypeName) {
			interfaceExtends.add(inheritedTypeName);
		}
	});

	return Array.from(interfaceExtends);
}

function renderInheritedType(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string | null {
	const directReferenceType = getDirectReferenceTypeName(schema, schemaMap, context);
	if (directReferenceType) {
		const resolvedReference = resolveSchemaReference(schema.$ref as string, context.currentSchemaPath, schemaMap);
		return isObjectLike(resolvedReference.resolvedSchema, resolvedReference.schemaPath, schemaMap)
			? directReferenceType
			: null;
	}

	if (!isObjectLike(schema, context.currentSchemaPath, schemaMap)) {
		return null;
	}

	return renderNamedObjectType(schema, schemaMap, context);
}

function collectOwnObjectShape(schema: JsonSchema): ObjectShape {
	const properties = new Map<string, JsonSchema>();
	for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
		properties.set(propertyName, propertySchema);
	}

	return {
		properties,
		required: new Set(schema.required ?? []),
	};
}

function collectObjectShape(
	schema: JsonSchema,
	schemaPath: string,
	schemaMap: Map<string, JsonSchema>,
	stack: string[]
): ObjectShape {
	const resolvedSchema = dereferenceSchema(schema, schemaMap, {
		currentSchemaPath: schemaPath,
		stack,
		currentTypeName: "",
		declarationState: {
			declarations: [],
			declaredTypeNames: new Set<string>(),
			imports: new Map<string, Set<string>>(),
		},
	});
	const properties = new Map<string, JsonSchema>();
	const required = new Set<string>();

	const mergeShape = (entrySchema: JsonSchema): void => {
		const nestedShape = collectObjectShape(entrySchema, schemaPath, schemaMap, stack);
		for (const [propertyName, propertySchema] of nestedShape.properties.entries()) {
			properties.set(propertyName, propertySchema);
		}
		for (const propertyName of nestedShape.required) {
			required.add(propertyName);
		}
	};

	if (resolvedSchema.allOf) {
		for (const entrySchema of resolvedSchema.allOf) {
			mergeShape(entrySchema);
		}
	}

	if (resolvedSchema.extends) {
		mergeShape(resolvedSchema.extends);
	}

	for (const [propertyName, propertySchema] of Object.entries(resolvedSchema.properties ?? {})) {
		properties.set(propertyName, propertySchema);
	}

	for (const propertyName of resolvedSchema.required ?? []) {
		required.add(propertyName);
	}

	return { properties, required };
}

function getDirectReferenceTypeName(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): string | null {
	if (!schema.$ref || Object.keys(schema).length !== 1) {
		return null;
	}

	const resolvedReference = resolveSchemaReference(schema.$ref, context.currentSchemaPath, schemaMap);
	const typeName = getTypeNameForReference(resolvedReference);

	if (resolvedReference.schemaPath !== context.currentSchemaPath) {
		registerImport(
			context.currentSchemaPath,
			resolvedReference.schemaPath,
			typeName,
			context.declarationState
		);
	}

	return typeName;
}

function resolveSchemaReference(
	reference: string,
	currentSchemaPath: string,
	schemaMap: Map<string, JsonSchema>
): ResolvedReference {
	const [referencePath, fragment] = reference.split("#");
	const normalizedPath = referencePath
		? normalizeSchemaPath(path.posix.normalize(path.posix.join(path.posix.dirname(currentSchemaPath), referencePath)))
		: currentSchemaPath;
	const targetSchema = schemaMap.get(normalizedPath);

	if (!targetSchema) {
		throw new Error(`Unable to resolve schema reference ${reference} from ${currentSchemaPath}`);
	}

	let resolvedNode: unknown = targetSchema;
	if (fragment) {
		for (const segment of fragment.split("/").filter(Boolean)) {
			if (typeof resolvedNode !== "object" || resolvedNode == null || !(segment in resolvedNode)) {
				throw new Error(`Unable to resolve fragment #${fragment} in ${normalizedPath}`);
			}
			resolvedNode = (resolvedNode as Record<string, unknown>)[segment];
		}
	}

	return {
		fragment,
		resolvedSchema: resolvedNode as JsonSchema,
		schemaPath: normalizedPath,
	};
}

function getTypeNameForReference(reference: ResolvedReference): string {
	const fileTypeName = toTypeName(path.posix.basename(reference.schemaPath, ".json"));
	if (!reference.fragment) {
		return fileTypeName;
	}

	const segments = reference.fragment
		.split("/")
		.filter(Boolean)
		.filter((segment) => segment !== "definitions");

	return [fileTypeName, ...segments.map(toTypeName)].join("");
}

function registerImport(
	fromSchemaPath: string,
	toSchemaPath: string,
	typeName: string,
	declarationState: DeclarationState
): void {
	const fromOutputPath = buildOutputPath(fromSchemaPath);
	const toOutputPath = buildOutputPath(toSchemaPath);
	let importPath = normalizeSchemaPath(
		path.posix.relative(path.posix.dirname(fromOutputPath), toOutputPath)
	).replace(/\.ts$/i, "");

	if (!importPath.startsWith(".")) {
		importPath = `./${importPath}`;
	}

	const existingTypeNames = declarationState.imports.get(importPath) ?? new Set<string>();
	existingTypeNames.add(typeName);
	declarationState.imports.set(importPath, existingTypeNames);
}

function dereferenceSchema(
	schema: JsonSchema,
	schemaMap: Map<string, JsonSchema>,
	context: ResolveContext
): JsonSchema {
	if (!schema.$ref) {
		return schema;
	}

	const cacheKey = `${context.currentSchemaPath}:${schema.$ref}`;
	if (context.stack.includes(cacheKey)) {
		return {};
	}

	const resolvedReference = resolveSchemaReference(schema.$ref, context.currentSchemaPath, schemaMap);

	return dereferenceSchema(resolvedReference.resolvedSchema, schemaMap, {
		currentSchemaPath: resolvedReference.schemaPath,
		stack: [...context.stack, cacheKey],
		currentTypeName: context.currentTypeName,
		declarationState: context.declarationState,
	});
}

function normalizeSchemaPath(entryPath: string): string {
	return entryPath.replace(/\\/g, "/");
}

function buildOutputPath(schemaPath: string): string {
	const relativeSchemaPath = schemaPath.slice(SCHEMA_ROOT.length);
	return relativeSchemaPath.replace(/\.json$/i, ".type.ts");
}

function buildIndexExport(schemaPath: string, relativeOutputPath: string): string {
	const namespace = toNamespaceName(schemaPath);
	const importPath = `./${relativeOutputPath.replace(/\.ts$/i, "").replace(/\\/g, "/")}`;
	return `export * as ${namespace} from "${importPath}";`;
}

function toNamespaceName(schemaPath: string): string {
	const parts = schemaPath
		.replace(/^schemas\//, "")
		.replace(/\.json$/i, "")
		.split("/")
		.map(toTypeName);
	return `${parts.join("")}Schema`;
}

function toTypeName(rawName: string): string {
	const words = rawName
		.replace(/\.json$/i, "")
		.replace(/[^a-zA-Z0-9]+/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

	const typeName = words.join("") || "Schema";
	return /^[0-9]/.test(typeName) ? `Schema${typeName}` : typeName;
}

function toPropertyName(propertyName: string): string {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName)
		? propertyName
		: JSON.stringify(propertyName);
}

function buildNestedTypeName(parentTypeName: string, propertyName: string): string {
	return `${parentTypeName}${toTypeName(propertyName)}`;
}

function normalizeTypeList(typeValue?: string | string[]): string[] {
	if (typeValue == null) {
		return [];
	}

	return Array.isArray(typeValue) ? typeValue : [typeValue];
}

function mapPrimitiveType(typeName: string): string | null {
	switch (typeName) {
		case "string":
			return "string";
		case "integer":
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "null":
			return "null";
		default:
			return null;
	}
}

function wrapForArray(typeExpression: string): string {
	return typeExpression.includes("|") || typeExpression.includes("&")
		? `(${typeExpression})`
		: typeExpression;
}

function joinUnion(typeExpressions: string[]): string {
	return Array.from(new Set(typeExpressions.filter(Boolean))).join(" | ");
}

function joinIntersection(typeExpressions: string[]): string {
	return Array.from(new Set(typeExpressions.filter(Boolean))).join(" & ");
}

function renderLiteral(value: string | number | boolean | null): string {
	return JSON.stringify(value);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exitCode = 1;
});