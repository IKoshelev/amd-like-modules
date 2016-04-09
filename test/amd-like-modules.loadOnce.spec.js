describe("amd-like-modules.loadOnce", function () {
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    ;
    function getTestScriptTags() {
        var scriptTags = document.getElementsByTagName('script');
        var srcMatches = [];
        for (var count1 = 0; count1 < scriptTags.length; count1++) {
            var tag = scriptTags[count1];
            if (endsWith(tag.src, 'test-script.js')) {
                srcMatches.push(tag);
            }
        }
        return srcMatches;
    }
    afterEach(function () {
        if (typeof window.testScriptLoadCounter != 'undefined') {
            delete window.testScriptLoadCounter;
        }
        var createdScriptTags = getTestScriptTags();
        for (var count1 = 0; count1 < createdScriptTags.length; count1++) {
            var tag = createdScriptTags[count1];
            tag.parentNode.removeChild(tag);
        }
    });
    it("should provide loadOnce function on window object", function () {
        expect(window.loadOnce).toBeDefined();
        expect(typeof window.loadOnce).toBe("function");
    });
    it("should be able to load scripts", function (done) {
        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        var tags = getTestScriptTags();
        setTimeout(function () {
            debugger;
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        }, 50);
    });
});
//# sourceMappingURL=amd-like-modules.loadOnce.spec.js.map