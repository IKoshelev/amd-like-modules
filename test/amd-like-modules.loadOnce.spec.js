describe("amd-like-modules.loadOnce", function () {
    window.loadOnce.appSubPath = "/base/test/files-available-to-tests/";
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    ;
    function getTestScriptTags(suffix) {
        if (suffix === void 0) { suffix = 'test-script.js'; }
        var scriptTags = document.getElementsByTagName('script');
        var srcMatches = [];
        for (var count1 = 0; count1 < scriptTags.length; count1++) {
            var tag = scriptTags[count1];
            if (endsWith(tag.src, suffix)) {
                srcMatches.push(tag);
            }
        }
        return srcMatches;
    }
    function getTestLinkTags(suffix) {
        if (suffix === void 0) { suffix = 'test-sheet.css'; }
        var linkTags = document.getElementsByTagName('link');
        var hrefMatches = [];
        for (var count1 = 0; count1 < linkTags.length; count1++) {
            var tag = linkTags[count1];
            if (endsWith(tag.href, suffix)) {
                hrefMatches.push(tag);
            }
        }
        return hrefMatches;
    }
    function deleteAll(tags) {
        for (var count1 = 0; count1 < tags.length; count1++) {
            var tag = tags[count1];
            tag.parentNode.removeChild(tag);
        }
    }
    afterEach(function () {
        if (typeof window.testScriptLoadCounter != 'undefined') {
            delete window.testScriptLoadCounter;
        }
        var createdScriptTags = getTestScriptTags();
        deleteAll(createdScriptTags);
        var createdLinkTags = getTestLinkTags();
        deleteAll(createdLinkTags);
        window.loadOnce.appSubPath = "/base/test/files-available-to-tests/";
    });
    it("should provide loadOnce function on window object", function () {
        expect(window.loadOnce).toBeDefined();
        expect(typeof window.loadOnce).toBe("function");
    });
    it("should be able to load scripts", function (done) {
        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        setTimeout(function () {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        }, 100);
    });
    it("should be able to load links", function (done) {
        window.loadOnce(["/base/test/files-available-to-tests/test-sheet.css"]);
        setTimeout(function () {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            done();
        }, 100);
    });
    it("can handle multiple files from the same base path", function (done) {
        window.loadOnce("/base/test/files-available-to-tests/", ["test-sheet.css",
            "test-script.js"]);
        setTimeout(function () {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            var tags2 = getTestScriptTags();
            expect(tags2.length).toBe(1);
            done();
        }, 100);
    });
    it("throws exception on wrong arguments", function () {
        expect(function () { return window.loadOnce(); }).toThrow();
        expect(function () { return window.loadOnce(""); }).toThrow();
        expect(function () { return window.loadOnce("", {}); }).toThrow();
    });
    it("ignores empty paths", function () {
        var tagsBefore = document.getElementsByTagName('script');
        window.loadOnce([""]);
        var tagsAfter = document.getElementsByTagName('script');
        expect(tagsBefore.length == tagsAfter.length);
    });
    it("throws exception when unknown file type  encountered", function () {
        expect(function () { return window.loadOnce(["/base/test/files-available-to-tests/test-sheet.bar"]); }).toThrow();
    });
    it("known script types can be extended with specified 'type' attribute value", function (done) {
        window.loadOnce.acceptableFileTypesForScript["service"] = "text/javascript";
        window.loadOnce(["~test-file.service"]);
        setTimeout(function () {
            var tag = getTestScriptTags("service")[0];
            expect(tag).toBeDefined();
            expect(tag.type).toBe("text/javascript");
            expect(window.testScriptLoadCounter).toBe(1);
            tag.parentNode.removeChild(tag);
            done();
        }, 100);
    });
    it("should not load same script twice", function (done) {
        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        setTimeout(function () {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        }, 100);
        setTimeout(function () {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        }, 200);
    });
    it("should substitute placeholder for app subpath", function (done) {
        window.loadOnce(["~test-script.js"]);
        setTimeout(function () {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        }, 100);
    });
    it("should substitute placeholder for app subpath if placeholder is part of base path", function (done) {
        window.loadOnce("~test-", ["sheet.css", "script.js"]);
        setTimeout(function () {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            var tags2 = getTestScriptTags();
            expect(tags2.length).toBe(1);
            done();
        }, 100);
    });
    it("should allow to set placeholder for app subpath", function (done) {
        window.loadOnce.subPathPlaceholder = '{marker}';
        window.loadOnce(["{marker}test-script.js"]);
        setTimeout(function () {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        }, 100);
    });
});
//# sourceMappingURL=amd-like-modules.loadOnce.spec.js.map