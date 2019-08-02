// Make tsc happy. Especially with libs without type definitions.
declare module 'webhdfs';
declare module 'unixify' {
    declare function unixify(filepath: string, stripTrailingSlash?: boolean): string;
    export = unixify;
}
declare module 'streamifier';
declare module 'node-yaml-parser' {
    export function parse(text: string): { readonly documents: YamlDocument[]; readonly lineLengths: number[] };

    export interface YamlNode {
        readonly kind: string;
        readonly raw: string;
        readonly startPosition: number;
        readonly endPosition: number;
        readonly parent?: any;
        readonly mappings: any[];
    }

    export interface YamlDocument {
        readonly nodes: YamlNode[];
        readonly errors: string[];
    }

    export interface Util {
        isKey(node: YamlNode): boolean;
        isMapping(node: YamlNode): boolean;
    }

    export const util: Util;
}
