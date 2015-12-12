/// <reference path="../typings/tsd.d.ts" />
describe("amd-like-modules", function () {
    var namespace1 = "foo";
    var namespace2 = "bar";
    var namespace3 = "baz";
    var namesapceIgnore = "ignore";
    var marker1 = {};
    var marker2 = {};
    var marker3 = {};
    var param1;
    var param2;
    var param3;
    afterEach(function () {
        window.simpleDefine.isAllowedExposeModulesAsNamespaces = true;
        window.simpleDefine.isAllowedNamedDependencies = false;
        window.simpleDefine.clearInternalNamespaceStructure();
        [namespace1, namespace2, namespace3, namesapceIgnore].forEach(function (ns) {
            delete window[ns];
        });
        marker1 = {};
        marker2 = {};
        marker3 = {};
        param1 = param2 = param3 = undefined;
    });
    it("should provide simpleDefine function on window object", function () {
        expect(window.simpleDefine).toBeDefined();
        expect(typeof window.simpleDefine).toBe("function");
    });
    it("should throw unless 3 arguments (string,[],function)", function () {
        expect(function () { return window.simpleDefine("", [], function () { }); }).not.toThrow();
        expect(function () { return window.simpleDefine("", {}, function () { }); }).toThrow();
        expect(function () { return window.simpleDefine({}, [], function () { }); }).toThrow();
        expect(function () { return window.simpleDefine("", [], {}); }).toThrow();
        expect(function () { return window.simpleDefine(); }).toThrow();
    });
    it("executes module body, passing in dependencies", function () {
        window.simpleDefine(namesapceIgnore, [marker1, null, marker2, marker3], function (_param1, ignore, _param2) {
            param1 = _param1;
            param2 = _param2;
            param3 = arguments[3];
        });
        expect(marker1 === param1).toBe(true);
        expect(marker2 === param2).toBe(true);
        expect(marker3 === param3).toBe(true);
    });
    it("by default exposes module output on window object via namespaces," +
        " preserving preexisting namesapces", function () {
        window.simpleDefine(namespace1, [], function () { return marker1; });
        expect(window[namespace1] === marker1).toBe(true);
        var combinedNamespace = namespace1 + "." + namespace2 + "." + namespace3;
        window.simpleDefine(combinedNamespace, [], function () { return marker2; });
        expect(window[namespace1] === marker1).toBe(true);
        expect(window[namespace1][namespace2][namespace3] === marker2).toBe(true);
    });
    it("can turn off exposing modules as namespaces", function () {
        window.simpleDefine.isAllowedExposeModulesAsNamespaces = false;
        window.simpleDefine(namespace1, [], function () { return marker1; });
        expect(window[namespace1]).not.toBeDefined();
    });
    it("ignores named dependencies by default", function () {
        expect(window.simpleDefine.isAllowedNamedDependencies).toBe(false);
        var marker1 = "foo";
        var param1;
        window.simpleDefine(namesapceIgnore, [marker1], function (_param1) {
            param1 = _param1;
        });
        expect(marker1 === param1).toBe(true);
    });
    function dependecyResolutionTest(testCase) {
        window.simpleDefine.isAllowedExposeModulesAsNamespaces = testCase;
        window.simpleDefine.isAllowedNamedDependencies = true;
        window.simpleDefine(namespace1, [], function () { return marker1; });
        window.simpleDefine(namesapceIgnore, [namespace1], function (_param1) {
            param1 = _param1;
            return {};
        });
        expect(marker1 === param1).toBe(true);
        var lastNamespace = "bax";
        var beforelastNamespace = "services";
        var fullNamespace = namespace2 + "." + beforelastNamespace + "." + lastNamespace;
        window.simpleDefine(fullNamespace, [], function () { return marker2; });
        window.simpleDefine(namesapceIgnore, [lastNamespace], function (_param2) {
            param2 = _param2;
        });
        expect(marker2 === param2).toBe(true);
        window.simpleDefine(namesapceIgnore, [fullNamespace], function (_param3) {
            param3 = _param3;
        });
        expect(marker2 === param3).toBe(true);
    }
    it("resolves named dependencies if flag is set", function () {
        dependecyResolutionTest(true);
    });
    it("resolves named dependencies if flag is set,"
        + " even when namespace are not exposed on window", function () {
        dependecyResolutionTest(false);
    });
    it("Clears existing namespace dict on clearNamesResolutionDictionary()", function () {
        window.simpleDefine.isAllowedNamedDependencies = true;
        window.simpleDefine(namespace1, [], function () { return marker1; });
        expect(function () { return window.simpleDefine(namesapceIgnore, [namespace1], function () { }); }).not.toThrow();
        window.simpleDefine.clearInternalNamespaceStructure();
        expect(function () { return window.simpleDefine(namesapceIgnore, [namespace1], function () { }); }).toThrow();
    });
    it("during named dependencies resolution " +
        "throws if not found or ambiguous", function () {
        window.simpleDefine.isAllowedNamedDependencies = true;
        expect(function () { return window.simpleDefine(namesapceIgnore, ["nonexistingDependency"], function () { }); }).toThrow();
        var commonName = "user";
        var firstCandidateNs = namespace1 + ".controllers." + commonName;
        var secondCandidateNs = namespace2 + ".services." + commonName;
        window.simpleDefine(firstCandidateNs, [], function () { });
        window.simpleDefine(secondCandidateNs, [], function () { });
        expect(function () { return window.simpleDefine(namesapceIgnore, [commonName], function () { }); }).toThrow();
    });
});
//# sourceMappingURL=amd-like-modules.spec.js.map