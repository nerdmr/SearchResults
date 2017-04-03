/// <reference path="SearchObjects.ts"/>
/**
 * See https://github.com/nerdmr/SearchResults#technical for some details about how this works.
 */
var SearchRender = (function () {
    /**
     * Takes the html element that represents the search results in page.
     */
    function SearchRender(resultsContentArea) {
        var _this = this;
        /**
         * OPTIONS
         */
        this.RoundTheme = false;
        this.CardTheme = false;
        this.ColorCoded = true;
        this.Query = "concerts";
        this.IncludeImage = true;
        this.ImageOnLeft = true;
        this.Modal = false;
        this.OverrideHyperLinkStyles = true;
        this.FixSide = true;
        this.FixTopCompensation = 52; // This is customizable per site. if the site uses a fixed top header you set this to the height of that to offset it.
        this.MaxACResults = 5;
        this.ShimmerLoad = true;
        this.ResultsInitialized = false;
        this.SearchResultsItemsDOM = new Array();
        this.FacetsDOM = new Array();
        this.DefaultPadding = 15;
        this.lastIndex = 0;
        this.animateSideTop = true;
        this.SearchResultsElement = resultsContentArea;
        this.SearchResultsElement.classList.add("no-bg");
        // wipe out results area just in case there was something there already
        this.SearchResultsElement.innerHTML = "";
        // Create public dom elements
        var inputContainer = document.createElement("div");
        var searchInputInner = document.createElement("div");
        this.SearchInputInner = searchInputInner;
        this.SearchInput = document.createElement("input");
        searchInputInner.appendChild(this.SearchInput);
        inputContainer.appendChild(searchInputInner);
        inputContainer.className = "search-input-container";
        searchInputInner.className = "search-input-inner";
        // SEARCH RESULTS
        // Create private dom elements
        var resultsContainer = document.createElement("div");
        var searchResultsDiv = document.createElement("div");
        this.searchResultsList = document.createElement("ul");
        var facets = document.createElement("div");
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
        var facetsDiv = document.createElement("div");
        facetsDiv.className = "facets-container-inner";
        this.facetsList = document.createElement("ul");
        this.facetsList.className = "facets-container-inner-list";
        facetsDiv.appendChild(this.createSideTileWithHtml("Recommended", "<a href='#'>Calendar</a>"));
        facetsDiv.appendChild(this.createSideTileWithHtml("Related Searches", "<a href='#'>Upcoming events</a>", "has-icon search-icon"));
        facetsDiv.appendChild(this.createSideTileWithInner("Categories", this.facetsList, "has-icon cat-icon"));
        var facetsContainer = document.createElement("div");
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
        this.SearchInput.addEventListener("keyup", function (evt) {
            _this.ACQuery = _this.SearchInput.value;
            _this.handleSearchKeyUp(evt);
        });
        // listen for clicks. Need this to clear autocomplete + modal results.
        document.addEventListener("click", function (evt) {
            if (_this.ACQuery) {
                _this.ACQuery = "";
                _this.ClearAutocompleteResults();
            }
        });
        document.addEventListener("keyup", function (evt) {
            if (evt.keyCode == 27) {
                if (_this.ACQuery) {
                    _this.ACQuery = "";
                    _this.ClearAutocompleteResults();
                }
            }
        });
    }
    SearchRender.prototype.handleSearchKeyUp = function (evt) {
        this.ClearAutocompleteResults();
        if (this.ACList && this.ACQuery) {
            this.DrawAutocompleteResults();
        }
    };
    SearchRender.prototype.clearResults = function () {
        this.searchResultsList.innerHTML = "";
    };
    SearchRender.prototype.DrawAutocompleteResults = function () {
        var _this = this;
        var acContainer = document.createElement("div");
        var acInner = document.createElement("div");
        var acList = document.createElement("div");
        acContainer.className = "ac-container";
        acInner.className = "ac-inner";
        acList.className = "ac-list";
        acContainer.appendChild(acInner);
        acInner.appendChild(acList);
        this.ACList.forEach(function (item, index) {
            if (index > _this.MaxACResults) {
                return;
            }
            var acItem = document.createElement("a");
            acItem.className = "ac-list-item type-" + item[1];
            if (index == 0) {
                acItem.className += " recommended";
            }
            acItem.href = "javascript:void(0);";
            acItem.innerHTML = item[0].replace(_this.ACQuery, "<strong>" + _this.ACQuery + "</strong>");
            acList.appendChild(acItem);
        });
        this.acContainer = acContainer;
        this.SearchInputInner.appendChild(acContainer);
    };
    SearchRender.prototype.ClearAutocompleteResults = function () {
        if (this.SearchInputInner.children.length > 1 && this.acContainer) {
            this.SearchInputInner.removeChild(this.acContainer);
        }
    };
    SearchRender.prototype.initializeModal = function () {
        var _this = this;
        this.SearchResultsElement.classList.add("modal");
        this.fixThreshold = 0;
        // REGISTER SCROLL EVENT LISTENER            
        this.hasScrollEvent = true;
        this.FacetsContainer.firstElementChild.style.top = "initial";
        this.SearchResultsElement.addEventListener("scroll", function (evt) {
            _this.scrollHandler();
        });
    };
    SearchRender.prototype.initializeNonModal = function () {
        var _this = this;
        this.SearchResultsElement.classList.remove("modal");
        if (this.FixSide) {
            // REGISTER SCROLL EVENT LISTENER
            this.hasScrollEvent = true;
            window.addEventListener("scroll", function (evt) {
                _this.scrollHandler();
            });
            this.calculateThreholds();
            this.FacetsContainer.firstElementChild.style.top = (this.DefaultPadding + this.FixTopCompensation).toString() + "px";
        }
    };
    SearchRender.prototype.initializeOptions = function () {
        if (this.ColorCoded)
            this.SearchResultsElement.classList.add("color-coded");
        if (this.RoundTheme)
            this.SearchResultsElement.classList.add("round-theme");
        if (this.CardTheme)
            this.SearchResultsElement.classList.add("card-theme");
        if (this.OverrideHyperLinkStyles) {
            this.SearchResultsElement.classList.add("override-hyperlink-styles");
        }
        if (this.Modal) {
            this.initializeModal();
        }
        else {
            this.initializeNonModal();
        }
    };
    SearchRender.prototype.calculateThreholds = function () {
        // set fixThreshold
        if (!this.Modal) {
            var rect = this.resultsContainer.getBoundingClientRect();
            this.fixThreshold = rect.top - this.FixTopCompensation;
            this.unfixThreshold = rect.top + rect.height;
        }
        else {
            this.fixThreshold = 0;
            this.unfixThreshold = 0;
        }
    };
    SearchRender.prototype.createSideTileWithHtml = function (title, html, titleClass) {
        if (titleClass === void 0) { titleClass = ""; }
        var div = document.createElement("div");
        div.innerHTML = html;
        return this.createSideTileWithInner(title, div, titleClass);
    };
    SearchRender.prototype.createSideTileWithInner = function (title, innerElement, titleClass) {
        if (titleClass === void 0) { titleClass = ""; }
        var div = document.createElement("div");
        div.innerHTML = "<div class='inner-tile'><h5 class='tile-title divider " + titleClass + "'>" + title + "</h5>";
        innerElement.classList.add("tile-body");
        div.appendChild(innerElement);
        div.className = "side-tile";
        return div;
    };
    SearchRender.prototype.RenderMoreResults = function (results, filter) {
        if (filter === void 0) { filter = ""; }
        this.RenderResults(results, true, filter);
    };
    SearchRender.prototype.RenderResults = function (results, loadingMore, filter) {
        var _this = this;
        if (filter === void 0) { filter = ""; }
        renderer.WaitingOnRequest = false;
        this.Results = results;
        var counter = 0;
        var doneReplacing = false;
        this.Results.results.forEach(function (item, index) {
            if (filter) {
                if (item.richSnippet.metatags.ogType != filter) {
                    return;
                }
            }
            if (_this.lastIndex + counter >= _this.SearchResultsItemsDOM.length) {
                // need to create a new element
                var li = _this.createNewResultLI(item);
                _this.searchResultsList.appendChild(li);
                _this.SearchResultsItemsDOM.push(li);
                doneReplacing = true;
            }
            else {
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].style.display = "block"; // just in case
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].classList.add(item.richSnippet.metatags.ogType);
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[0].innerHTML = item.title;
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[0].classList.remove("loading");
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[1].innerHTML = item.content;
                _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[1].classList.remove("loading-2");
                if (_this.IncludeImage && _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children.length > 2 && item.richSnippet.cseThumbnail.src) {
                    _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[2].style.backgroundImage = "url('" + item.richSnippet.cseThumbnail.src + "')";
                    _this.SearchResultsItemsDOM[_this.lastIndex + counter].firstElementChild.children[2].classList.remove("loading-img");
                }
            }
            counter++;
        });
        if (!doneReplacing) {
            // remove placeholders
            for (var i = 0; i < this.SearchResultsItemsDOM.length; i++) {
                if (this.SearchResultsItemsDOM[i].firstElementChild.children[0].classList.contains("loading")) {
                    this.SearchResultsItemsDOM[i].style.display = "none";
                }
            }
        }
        this.lastIndex += counter;
        if (!loadingMore) {
            this.Results.context.facets.forEach(function (item, index) {
                if (index >= _this.FacetsDOM.length) {
                    // need to create a new element
                    var li = _this.createNewFacetLI(item.title, item.count);
                    _this.facetsList.appendChild(li);
                    _this.FacetsDOM.push(li);
                    li.addEventListener("click", function (evt) {
                        var selected = document.getElementsByClassName("facet-selected");
                        if (selected.length > 0) {
                            selected[0].classList.remove("facet-selected");
                        }
                        if (item.id) {
                            evt.target.classList.add("facet-selected");
                        }
                        _this.filterResults(item.id);
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
    };
    SearchRender.prototype.filterResults = function (category) {
        var _this = this;
        // iterate through search results
        this.clearResults();
        this.RenderResults(this.Results, false, category);
        this.initializeResults();
        // for dramatic effect
        this.WaitingOnRequest = true;
        setTimeout(function () {
            _this.RenderMoreResults(_this.Results, category);
        }, 1500);
    };
    SearchRender.prototype.scrollHandler = function (forceHandle) {
        var _this = this;
        if (forceHandle === void 0) { forceHandle = false; }
        if (this.FixSide) {
            if (this.Modal) {
                /* MODAL SCROLL HANDLING */
                var topToCompare = this.SearchResultsElement.scrollTop;
                if (topToCompare > this.fixThreshold && (!this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
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
                    setTimeout(function () {
                        _this.RenderMoreResults(_this.Results);
                    }, 1500);
                }
            }
            else {
                /* NON MODAL SCROLL HANDLING */
                var topToCompare = window.pageYOffset;
                var eleBottom = topToCompare + (this.DefaultPadding + this.FixTopCompensation) + this.FacetsContainer.firstElementChild.offsetHeight;
                if (topToCompare > this.fixThreshold && ((!this.SearchResultsElement.classList.contains("fix-side") || forceHandle) || this.SearchResultsElement.classList.contains("fixing-bottom")) && eleBottom < this.unfixThreshold) {
                    // in here when scrolling down past the threshold and we don't already have fix-side
                    this.SearchResultsElement.classList.add("fix-side");
                    this.SearchResultsElement.classList.remove("fixing-bottom");
                    // minimize jerkiness
                    var adjustTo = (this.DefaultPadding + this.FixTopCompensation);
                    var tempTop = adjustTo + (this.fixThreshold - topToCompare);
                    tempTop = adjustTo;
                    this.FacetsContainer.firstElementChild.style.top = tempTop.toString() + "px";
                    // setTimeout(()=>{
                    //     (<HTMLElement>this.FacetsContainer.firstElementChild).style.top = (this.DefaultPadding + this.FixTopCompensation).toString() + "px";
                    // },0);
                }
                else if (topToCompare <= this.fixThreshold && (this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
                    this.SearchResultsElement.classList.remove("fix-side");
                }
                else if (eleBottom > this.unfixThreshold && (this.SearchResultsElement.classList.contains("fix-side") || forceHandle)) {
                    if (!this.SearchResultsElement.classList.contains("fixing-bottom"))
                        this.SearchResultsElement.classList.add("fixing-bottom");
                    var diff = this.unfixThreshold - (topToCompare + (this.DefaultPadding + this.FixTopCompensation) + this.FacetsContainer.firstElementChild.offsetHeight);
                    var top = this.DefaultPadding + this.FixTopCompensation + diff;
                    this.FacetsContainer.firstElementChild.style.top = top + "px";
                }
            }
        }
    };
    SearchRender.prototype.createPlaceholderLI = function () {
        var ele = this.createNewResultLI(null);
        ele.firstElementChild.children[0].classList.add("loading");
        ele.firstElementChild.children[1].classList.add("loading-2");
        if (ele.firstElementChild.children.length > 2) {
            ele.firstElementChild.children[2].classList.add("loading-img");
        }
        return ele;
    };
    SearchRender.prototype.createNewResultLI = function (item) {
        var title;
        var content;
        var imgUrl = "";
        var li = document.createElement("li");
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
        var htmlString = "<a href=\"#\">\n                <h4 class='search-result-title'>" + title + "</h4>\n                <div class='search-result-content'>" + content + "</div>";
        if (this.IncludeImage) {
            htmlString += "<div style=\"background-image:url(\'" + imgUrl + "\');\" class='result-image'></div></a>";
        }
        else {
            htmlString += "</a>";
        }
        li.innerHTML = htmlString;
        return li;
    };
    SearchRender.prototype.createNewFacetLI = function (title, count) {
        var li = document.createElement("li");
        li.className = "facet-item";
        li.innerHTML = "<a href='javascript:void(0);'>" + title + " (" + count.toString() + ")</a>";
        return li;
    };
    SearchRender.prototype.initializeResults = function () {
        for (var i = 1; i < 6; i++) {
            // Build HTML string
            var li = this.createPlaceholderLI();
            this.searchResultsList.appendChild(li);
            this.SearchResultsItemsDOM.push(li);
        }
    };
    SearchRender.prototype.renderSearchResults = function () {
        var htmlResultsString = "<div class='results-container'>";
        if (this.Results && this.Results.results && this.SearchResultsElement) {
            htmlResultsString += "<div class='search-results'><ul class='search-results-inner'>";
            this.Results.results.forEach(function (item, index) {
                // Build HTML string
                htmlResultsString +=
                    "<li class='search-result-item'>\n                        <h4 class='search-result-title'>" + item.title + "</h4>\n                        <div class='search-result-content'>" + item.content + "</div>\n                    </li>";
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
    };
    SearchRender.prototype.loadSearchJson = function () {
    };
    /**
     * OPtion toggles for demo
     */
    SearchRender.prototype.ToggleColorCoded = function () {
        this.ColorCoded = !this.ColorCoded;
        if (this.ColorCoded) {
            this.SearchResultsElement.classList.remove("color-coded");
        }
        else {
            this.SearchResultsElement.classList.add("color-coded");
        }
        this.calculateThreholds();
    };
    SearchRender.prototype.ToggleModal = function () {
        this.Modal = !this.Modal;
        if (this.Modal) {
            this.initializeModal();
        }
        else {
            this.initializeNonModal();
        }
    };
    SearchRender.prototype.ToggleRounded = function () {
        this.RoundTheme = !this.RoundTheme;
        if (this.RoundTheme) {
            this.SearchResultsElement.classList.add("round-theme");
        }
        else {
            this.SearchResultsElement.classList.remove("round-theme");
        }
    };
    SearchRender.prototype.ToggleCard = function () {
        this.CardTheme = !this.CardTheme;
        if (this.CardTheme)
            this.SearchResultsElement.classList.add("card-theme");
        else {
            this.SearchResultsElement.classList.remove("card-theme");
        }
    };
    return SearchRender;
}());
var renderer;
renderer = new SearchRender(document.getElementsByClassName("contentMain")[0]);
//renderer = new SearchRender(<HTMLElement>document.getElementById("contentAndRelated"));
/**
 * JsonP callback handler
 * @param results - results object
 */
function LoadJson(results) {
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
    setTimeout(function () {
        renderer.RenderResults(results, false);
    }, 1500);
}
function LoadAC(acObject) {
    if (acObject) {
        if (acObject.length > 2) {
            var query = acObject[0];
            var acList = acObject[1];
            renderer.ACList = acList;
        }
    }
}
//# sourceMappingURL=SearchRender.js.map