declare module Bruflodt.SearchResults {

    export interface Page {
        label: number;
        start: string;
    }

    export interface Cursor {
        currentPageIndex: number;
        estimatedResultCount: string;
        moreResultsUrl: string;
        resultCount: string;
        searchResultTime: string;
        pages: Page[];
    }

    export interface Context {
        title: string;
        total_results: string;
        facets: Facet[];
    }

    export interface Facet {
        title: string;
        count: number;
        id: string;
    }

    export interface CseImage {
        src: string;
    }

    export interface Metatags {
        viewport: string;
        ogTitle: string;
        ogType: string;
        ogUrl: string;
        ogSiteName: string;
        ogImage: string;
        ogStreetAddress: string;
        ogLocality: string;
        ogRegion: string;
        ogCountry: string;
        ogEmail: string;
        ogPhoneNumber: string;
    }

    export interface CseThumbnail {
        width: string;
        height: string;
        src: string;
    }

    export interface RichSnippet {
        cseImage: CseImage;
        metatags: Metatags;
        cseThumbnail: CseThumbnail;
    }

    export interface Result {
        GsearchResultClass: string;
        cacheUrl: string;
        clicktrackUrl: string;
        content: string;
        contentNoFormatting: string;
        formattedUrl: string;
        title: string;
        titleNoFormatting: string;
        unescapedUrl: string;
        url: string;
        visibleUrl: string;
        richSnippet: RichSnippet;
    }

    export interface SearchResult {
        cursor: Cursor;
        context: Context;
        results: Result[];
    }

}