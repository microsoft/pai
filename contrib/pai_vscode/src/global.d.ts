// Make tsc happy. Especially with libs without type definitions.
declare module 'webhdfs';
declare module 'unixify' {
    declare function unixify(filepath: string, stripTrailingSlash?: boolean): string;
    export = unixify;
}
declare module 'streamifier';