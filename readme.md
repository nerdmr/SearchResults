# Search Results Solution

## Overview

This repository represents a dynamically loaded search solution. The results and rendering code are outsourced to a third party service. The search query itself is static along with most of the page with the exception of in-page user interactions. This solution was developed with reusability and customizability in mind.

## Demo

http://josh.bruflodt.com/projects/code/search-results/

## Technical

Index.html includes just a few scripts in addition to the static content that came when the page was saved. The bulk of the code that renders results lives in Scripts/SearchRender.ts.

## Codeflow Summary

This particular search query overrides a Custom Google Search solution. The results from the Google search query have been slightly altered and can be found in /Resources/AutoCompleteJsonP.js. The function called in that file (LoadJson) lives in /Scripts/SearchRender.ts at the bottom. It passes the search results data model into the SearchRender instance in order to be displayed on the screen. Anywhere you see setTimeout it's intended to simulate network latency since this solution would typically be making asynchronous calls to a server to get the results. The motivation behind a solution like this is that I thought it most closely would resemble the kind of solution used when search results are outsourced. The top of The SearchRender class has many options that can be toggled that better fit the containing website styles.