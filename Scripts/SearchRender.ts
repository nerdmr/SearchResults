/// <reference path="SearchObjects.ts"/>

class SearchRender {
    /**
     * OPTIONS
     */
    RoundTheme: boolean = false;
    CardTheme: boolean = false;
    ColorCoded: boolean = true;
    Query: string = "concerts";
    IncludeImage: boolean = true;
    ImageOnLeft: boolean = true;
    Modal: boolean = false;
    OverrideHyperLinkStyles: boolean = true;
    FixSide: boolean = true;
    FixTopCompensation: number = 52; // This is customizable per site. if the site uses a fixed top header you set this to the height of that to offset it.
    MaxACResults: number = 5;

    /**
     * Public members
     */
    Results: Bruflodt.SearchResults.SearchResult;
    SearchResultsElement: HTMLElement;
    SearchInputInner: HTMLDivElement;
    SearchInput: HTMLInputElement;
    ShimmerLoad: boolean = true;
    ResultsInitialized: boolean = false;
    SearchResultsItemsDOM: Array<HTMLElement> = new Array<HTMLElement>();
    FacetsDOM: Array<HTMLElement> = new Array<HTMLElement>();
    FacetsContainer: HTMLElement;
    WaitingOnRequest: boolean;
    DefaultPadding: number = 15;
    ACQuery: string;
    ACList: Array<Array<any>>;

    /**
     * Private members
     */
    
    private searchResultsList: HTMLUListElement;
    private facetsList: HTMLUListElement;
    private lastKnownScrollPosition: number;
    private lastIndex: number = 0;
    private fixThreshold: number;
    private unfixThreshold: number;
    private resultsContainer: HTMLDivElement;
    private hasScrollEvent: boolean;
    private acContainer: HTMLDivElement;

    /**
     * Takes the html element that represents the search results in page.
     */
    constructor(resultsContentArea: HTMLElement) {
        this.SearchResultsElement = resultsContentArea;
        this.SearchResultsElement.classList.add("no-bg");
        // wipe out results area just in case there was something there already
        this.SearchResultsElement.innerHTML = "";

        // Create public dom elements
        let inputContainer: HTMLDivElement = document.createElement("div");
        let searchInputInner: HTMLDivElement = document.createElement("div");
        this.SearchInputInner = searchInputInner;        
        this.SearchInput = document.createElement("input");
        searchInputInner.appendChild(this.SearchInput);
        inputContainer.appendChild(searchInputInner);
        inputContainer.className = "search-input-container";
        searchInputInner.className = "search-input-inner";

        // SEARCH RESULTS
        // Create private dom elements
        let resultsContainer: HTMLDivElement = document.createElement("div");
        let searchResultsDiv: HTMLDivElement = document.createElement("div");
        this.searchResultsList = document.createElement("ul");
        let facets:HTMLDivElement = document.createElement("div");
        
        // Set classes for newly created elements
        resultsContainer.className = "results-container";
        searchResultsDiv.className = "search-results";
        this.resultsContainer = resultsContainer;
        this.searchResultsList.className = "search-results-inner";
        this.SearchInput.className = "search-input";
        this.SearchInput.placeholder = this.Query;
        searchResultsDiv.appendChild(this.searchResultsList);
        resultsContainer.appendChild(searchResultsDiv);

        // Facets
        let facetsDiv:HTMLDivElement = document.createElement("div");
        facetsDiv.className = "facets-container-inner";
        this.facetsList = document.createElement("ul");
        this.facetsList.className = "facets-container-inner-list";
        facetsDiv.appendChild(this.createSideTileWithHtml("Recommended", "<a href='#'>Calendar</a>"));
        facetsDiv.appendChild(this.createSideTileWithHtml("Related Searches", "<a href='#'>Upcoming events</a>", "has-icon search-icon"));
        facetsDiv.appendChild(this.createSideTileWithInner("Categories", this.facetsList, "has-icon cat-icon"));
        let facetsContainer:HTMLDivElement = document.createElement("div");
        facetsContainer.className = "facets-container";
        this.FacetsContainer = facetsContainer;
        facetsContainer.appendChild(facetsDiv);
        facets.appendChild(facetsContainer);
        resultsContainer.appendChild(facets.firstChild);

        // Initialize some stuff before we put it in the dom.
        this.initializeOptions();

        // Bring it together
        this.SearchResultsElement.appendChild(inputContainer);
        this.SearchResultsElement.appendChild(resultsContainer);
        this.ResultsInitialized = true;

        if (this.ShimmerLoad) {
            // render placholders
            this.initializeResults();
        }

        // Add event listener for search input
        this.SearchInput.addEventListener("keyup", (evt) => {
            this.ACQuery = this.SearchInput.value;
            this.handleSearchKeyUp(evt);            
        });

        // listen for clicks. Need this to clear autocomplete + modal results.
        document.addEventListener("click", (evt) => {
            if (this.ACQuery) {
                this.ACQuery = "";
                this.ClearAutocompleteResults();
            }
        });

        document.addEventListener("keyup", (evt) => {
            if (evt.keyCode == 27) { // escape key maps to keycode `27`
                if (this.ACQuery) {
                    this.ACQuery = "";
                    this.ClearAutocompleteResults();
                }   
            }
        });
    }

    private handleSearchKeyUp(evt:KeyboardEvent) {
        this.ClearAutocompleteResults();
        if (this.ACList && this.ACQuery) {        
            this.DrawAutocompleteResults();
        }
    }

    private clearResults() {
        this.searchResultsList.innerHTML = "";
    }

    public DrawAutocompleteResults() {
        let acContainer: HTMLDivElement = document.createElement("div");
        let acInner: HTMLDivElement = document.createElement("div");
        let acList:HTMLDivElement = document.createElement("div");
        
        acContainer.className = "ac-container";
        acInner.className = "ac-inner";
        acList.className = "ac-list";

        acContainer.appendChild(acInner);
        acInner.appendChild(acList);
        
        this.ACList.forEach((item, index) => {
            if (index > this.MaxACResults) {
                return;
            }

            let acItem:HTMLAnchorElement = document.createElement("a");

            acItem.className = "ac-list-item type-" + item[1];

            if (index == 0) {
                acItem.className += " recommended";

            }

            acItem.href = "javascript:void(0);"
            acItem.innerHTML = (<string>item[0]).replace(this.ACQuery, "<strong>" + this.ACQuery + "</strong>");
            acList.appendChild(acItem);
        });

        this.acContainer = acContainer;
        this.SearchInputInner.appendChild(acContainer);
    }

    public ClearAutocompleteResults() {
        if (this.SearchInputInner.children.length > 1 && this.acContainer) {
            this.SearchInputInner.removeChild(this.acContainer);
        }
    }

    private initializeModal() {
        this.SearchResultsElement.classList.add("modal");
        this.fixThreshold = 0;
        // REGISTER SCROLL EVENT LISTENER            
        this.hasScrollEvent = true;
        (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = "initial";
        this.SearchResultsElement.addEventListener("scroll", (evt) => {
            this.scrollHandler();
        });
    }
    private initializeNonModal() {
        this.SearchResultsElement.classList.remove("modal");
        if (this.FixSide) {
            // REGISTER SCROLL EVENT LISTENER
            this.hasScrollEvent = true;
            window.addEventListener("scroll", (evt) => {
                this.scrollHandler();
            });

            this.calculateThreholds();
            (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = (this.DefaultPadding + this.FixTopCompensation).toString() + "px";
        }
    }

    private initializeOptions() {
        if (this.ColorCoded) this.SearchResultsElement.classList.add("color-coded");
        if (this.RoundTheme) this.SearchResultsElement.classList.add("round-theme");
        if (this.CardTheme) this.SearchResultsElement.classList.add("card-theme");
        if (this.OverrideHyperLinkStyles) {
            this.SearchResultsElement.classList.add("override-hyperlink-styles");
        }        
        if (this.Modal) {
            this.initializeModal();
        }
        else {
            this.initializeNonModal();
        }
    }

    private calculateThreholds() {
        // set fixThreshold
        if (!this.Modal) {
            let rect:ClientRect = this.resultsContainer.getBoundingClientRect();
            this.fixThreshold = rect.top - this.FixTopCompensation;
            this.unfixThreshold = rect.top + rect.height;
        }
        else {
            this.fixThreshold = 0;
            this.unfixThreshold = 0;
        }
    }

    private createSideTileWithHtml(title:string, html:string, titleClass = "") {
        let div: HTMLDivElement = document.createElement("div");
        div.innerHTML = html;
        return this.createSideTileWithInner(title, div, titleClass);
    }

    private createSideTileWithInner(title: string, innerElement: HTMLElement, titleClass = "") {
        let div: HTMLDivElement = document.createElement("div");
        div.innerHTML = "<div class='inner-tile'><h5 class='tile-title divider " + titleClass + "'>" + title + "</h5>"
        innerElement.classList.add("tile-body");
        div.appendChild(innerElement);
        div.className = "side-tile";
        return div; 
    }

    RenderMoreResults(results: Bruflodt.SearchResults.SearchResult, filter: string = "") {
        this.RenderResults(results, true, filter);        
    }

    RenderResults(results: Bruflodt.SearchResults.SearchResult, loadingMore:boolean, filter:string = "") {
        renderer.WaitingOnRequest = false;

        this.Results = results;
        var counter = 0;
        var doneReplacing = false;
        this.Results.results.forEach((item, index) => {            
            if (filter) {
                if (item.richSnippet.metatags.ogType != filter) {
                    return;
                }
            }
            
            if (this.lastIndex + counter >= this.SearchResultsItemsDOM.length) {
                // need to create a new element
                let li: HTMLLIElement = this.createNewResultLI(item);
                this.searchResultsList.appendChild(li);
                this.SearchResultsItemsDOM.push(li);
                doneReplacing = true;
            }
            else {
                this.SearchResultsItemsDOM[this.lastIndex + counter].style.display = "block"; // just in case
                this.SearchResultsItemsDOM[this.lastIndex + counter].classList.add(item.richSnippet.metatags.ogType);
                this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[0].innerHTML = item.title;
                this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[0].classList.remove("loading");
                this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[1].innerHTML = item.content;
                this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[1].classList.remove("loading-2");
                if (this.IncludeImage && this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children.length > 2 && item.richSnippet.cseThumbnail.src) {
                    (<HTMLDivElement> this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[2]).style.backgroundImage = "url('" + item.richSnippet.cseThumbnail.src + "')";
                    this.SearchResultsItemsDOM[this.lastIndex + counter].firstElementChild.children[2].classList.remove("loading-img");
                }
            }
            counter++;
        });

        if (!doneReplacing) {
            // remove placeholders
            for (var i = 0; i < this.SearchResultsItemsDOM.length;i ++) {
                if (this.SearchResultsItemsDOM[i].firstElementChild.children[0].classList.contains("loading")) {
                    this.SearchResultsItemsDOM[i].style.display = "none";
                }
            }
        }

        this.lastIndex += counter;
        
        if (!loadingMore) {
            this.Results.context.facets.forEach((item, index) => {
                if (index >= this.FacetsDOM.length) {
                    // need to create a new element
                    let li: HTMLLIElement = this.createNewFacetLI(item.title, item.count);
                    this.facetsList.appendChild(li);
                    this.FacetsDOM.push(li);
                    li.addEventListener("click", (evt) => {  
                        var selected = document.getElementsByClassName("facet-selected");
                        if (selected.length > 0) {
                            selected[0].classList.remove("facet-selected");
                        }
                        
                        if (item.id) {
                            (<HTMLLIElement>evt.target).classList.add("facet-selected");
                        }
                        this.filterResults(item.id);
                    });

                }
                else {
                    // this is for loading
                }
            });

            // highjacking some click events here...

            // this.FacetsDOM[0].addEventListener("click", () => { renderer.ToggleModal() });
            // this.FacetsDOM[1].addEventListener("click", () => { renderer.ToggleCard() });
            // this.FacetsDOM[2].addEventListener("click", () => { renderer.ToggleRounded() });
            // this.FacetsDOM[3].addEventListener("click", () => { renderer.ToggleColorCoded() });
        }
        
        this.calculateThreholds();
        this.scrollHandler(true);
        
    }

    private filterResults(category: string) {
        // iterate through search results
        this.clearResults();
        this.RenderResults(this.Results, false, category);

        this.initializeResults();

        // for dramatic effect
        this.WaitingOnRequest = true;

        setTimeout(() => {
            this.RenderMoreResults(this.Results, category);
        }, 1500);
    }

    private animateSideTop:boolean = true;
    private scrollHandler(forceHandle: boolean = false) {        
        if (this.FixSide) {
            if (this.Modal) {
                /* MODAL SCROLL HANDLING */
                var topToCompare = this.SearchResultsElement.scrollTop;

                if (topToCompare > this.fixThreshold && (!this.SearchResultsElement.classList.contains("fix-side") || forceHandle) {
                    if (!this.animateSideTop) {
                        this.SearchResultsElement.classList.add("fix-side");
                    }
                    else {
                        this.SearchResultsElement.classList.add("fix-side");
                    }
                }
                else if (topToCompare <= this.fixThreshold && (this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
                    this.SearchResultsElement.classList.remove("fix-side");
                }

                var bottom = this.SearchResultsElement.scrollTop + this.SearchResultsElement.clientHeight;
                if (bottom == this.SearchResultsElement.scrollHeight && !this.WaitingOnRequest) {
                    // incrementally load some more
                    this.initializeResults();

                    // for dramatic effect
                    this.WaitingOnRequest = true;

                    setTimeout(() => {
                        this.RenderMoreResults(this.Results);
                    }, 1500);
                }  
            }
            else {
                /* NON MODAL SCROLL HANDLING */
                var topToCompare = window.pageYOffset;
                var eleBottom = topToCompare + (this.DefaultPadding + this.FixTopCompensation) + (<HTMLElement>this.FacetsContainer.firstElementChild).offsetHeight;

                if (topToCompare > this.fixThreshold && ((!this.SearchResultsElement.classList.contains("fix-side") || forceHandle) || this.SearchResultsElement.classList.contains("fixing-bottom")) && eleBottom < this.unfixThreshold) {
                    // in here when scrolling down past the threshold and we don't already have fix-side
                    this.SearchResultsElement.classList.add("fix-side");
                    this.SearchResultsElement.classList.remove("fixing-bottom")
                    // minimize jerkiness
                    var adjustTo = (this.DefaultPadding + this.FixTopCompensation);
                    var tempTop = adjustTo + (this.fixThreshold - topToCompare);
                    tempTop = adjustTo;
                    (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = tempTop.toString() + "px";
                    // setTimeout(()=>{
                    //     (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = (this.DefaultPadding + this.FixTopCompensation).toString() + "px";
                    // },0);
                }
                else if (topToCompare <= this.fixThreshold && (this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
                    this.SearchResultsElement.classList.remove("fix-side");
                }
                else if (eleBottom > this.unfixThreshold && (this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
                    if (!this.SearchResultsElement.classList.contains("fixing-bottom")) this.SearchResultsElement.classList.add("fixing-bottom");
                    var diff = this.unfixThreshold - (topToCompare + (this.DefaultPadding + this.FixTopCompensation) + (<HTMLElement>this.FacetsContainer.firstElementChild).offsetHeight);
                    var top = this.DefaultPadding + this.FixTopCompensation + diff;
                    (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = top + "px";
                }
            }
        }
    }

    private createPlaceholderLI() {
        let ele:HTMLLIElement = this.createNewResultLI(null);
        ele.firstElementChild.children[0].classList.add("loading");
        ele.firstElementChild.children[1].classList.add("loading-2");
        if (ele.firstElementChild.children.length > 2) {
            ele.firstElementChild.children[2].classList.add("loading-img");
        }
        return ele;
    }

    private createNewResultLI(item: Bruflodt.SearchResults.Result) {

        var title;
        var content;
        var imgUrl = "";

        let li: HTMLLIElement = document.createElement("li");
        li.className = "search-result-item";

        if (item) {
            title = item.title;
            content = item.content;
            
            if (this.IncludeImage) {
                imgUrl = item.richSnippet.cseThumbnail.src;
            }

            li.classList.add(item.richSnippet.metatags.ogType);
        }
        else {
            title = "&nbsp;";
            content = "&nbsp;<br/>&nbsp;";
        }

        if (this.IncludeImage) {
            li.classList.add("has-img");
            if (this.ImageOnLeft) {
                li.classList.add("left-img");
            } 
        }

        var htmlString = `<a href="#">
                <h4 class='search-result-title'>`+title+`</h4>
                <div class='search-result-content'>`+content+`</div>`;

        if (this.IncludeImage) {
            htmlString += "<div style=\"background-image:url(\'" + imgUrl + "\');\" class='result-image'></div></a>";
        } 
        else {
            htmlString += "</a>";
        }
        li.innerHTML = htmlString;

        return li;
    }

    private createNewFacetLI(title:string, count:number) {
        let li: HTMLLIElement = document.createElement("li");
        li.className = "facet-item";
        li.innerHTML = "<a href='javascript:void(0);'>"+title + " (" + count.toString() + ")</a>";
        return li;
    }

    private initializeResults() {
        for (var i = 1; i < 6; i++) {
            // Build HTML string
            let li: HTMLLIElement = this.createPlaceholderLI();
            this.searchResultsList.appendChild(li);
            this.SearchResultsItemsDOM.push(li);
        }
    }

    private renderSearchResults() {
        let htmlResultsString:string = "<div class='results-container'>";
        if (this.Results && this.Results.results && this.SearchResultsElement) {

            htmlResultsString += "<div class='search-results'><ul class='search-results-inner'>";
            this.Results.results.forEach((item, index) => {
                // Build HTML string
                htmlResultsString += 
                    `<li class='search-result-item'>
                        <h4 class='search-result-title'>` + item.title + `</h4>
                        <div class='search-result-content'>` + item.content + `</div>
                    </li>`;                
                htmlResultsString += "</li>";
            });

            // close search results and start facets
            htmlResultsString += "</div></ul><div class='facets-container'><ul class='facets-container-inner'>";

            // build facets
            for (var i = 1; i < 6; i++) {
                htmlResultsString += "<li class='facet-item'>Facet " + i.toString() + "</li>";
            }
        

            htmlResultsString += "</ul></div>";
        }
        htmlResultsString += "</div>";

        this.SearchResultsElement.innerHTML = htmlResultsString;
    }

    private loadSearchJson() {
        
    }

    /**
     * OPtion toggles for demo
     */
    public ToggleColorCoded() {
        this.ColorCoded = !this.ColorCoded;
        if (this.ColorCoded) {
            this.SearchResultsElement.classList.remove("color-coded");
        }
        else {
            this.SearchResultsElement.classList.add("color-coded");
        }
        this.calculateThreholds();
    }

    public ToggleModal() {
        this.Modal = !this.Modal;
        if (this.Modal) {
            this.initializeModal();
        }
        else {
            this.initializeNonModal();
        }
    }

    public ToggleRounded() {
        this.RoundTheme = !this.RoundTheme;
        if (this.RoundTheme) {
            this.SearchResultsElement.classList.add("round-theme");
        }
        else {
            this.SearchResultsElement.classList.remove("round-theme");
        }
        
    }

    public ToggleCard() {
        this.CardTheme = !this.CardTheme;
        if (this.CardTheme) this.SearchResultsElement.classList.add("card-theme");
        else {
            this.SearchResultsElement.classList.remove("card-theme");
        }
    }
}

let renderer:SearchRender;
renderer = new SearchRender(<HTMLElement>document.getElementsByClassName("contentMain")[0]);
//renderer = new SearchRender(<HTMLElement>document.getElementById("contentAndRelated"));

/**
 * JsonP callback handler
 * @param results - results object
 */
function LoadJson(results: Bruflodt.SearchResults.SearchResult) {
    // if facets is empty let's populate with some default data.
    if (results.context.facets.length == 0) {
        results.context.facets.push({ title: "All", count: 90, id: "" });
        results.context.facets.push({ title: "Events", count: 23, id: "type-events" });
        results.context.facets.push({ title: "Alumni News", count: 36, id: "type-alumni-news" });
        results.context.facets.push({ title: "Current Students", count: 2, id: "type-current-students" });
        results.context.facets.push({ title: "Other", count: 17, id: "type-other" });
        results.context.facets.push({ title: "Documents", count: 12, id: "type-documents" });
    }

    renderer.WaitingOnRequest = true;
    // timeout simulates load time
    setTimeout(() => {
        renderer.RenderResults(results, false);
    },
    1500);
}

function LoadAC(acObject:any) {
    if (acObject) {
        if (acObject.length > 2) {
            var query = acObject[0];
            var acList = acObject[1];
            renderer.ACList = acList;
        }
    }
}