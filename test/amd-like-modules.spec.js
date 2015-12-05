/// <reference path="../typings/tsd.d.ts" />
describe("amd-like-modules", function () {
    afterEach(function () {
        window.simpleDefine.clearNamesResolutionDictionary();
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
        var marker1 = {};
        var param1;
        var marker2 = {};
        var param2;
        var marker3 = {};
        var param3;
        window.simpleDefine("ignore", [marker1, null, marker2, marker3], function (_param1, ignore, _param2) {
            param1 = _param1;
            param2 = _param2;
            param3 = arguments[3];
        });
        expect(marker1 === param1).toBe(true);
        expect(marker2 === param2).toBe(true);
        expect(marker3 === param3).toBe(true);
    });
    it("exposes module output on window object via namespaces," +
        " preserving preexisting namesapces", function () {
        var marker1 = {};
        var namespace1 = "foo";
        window.simpleDefine(namespace1, [], function () { return marker1; });
        expect(window[namespace1] === marker1).toBe(true);
        var marker2 = {};
        var namespace2 = "bar";
        var namespace3 = "baz";
        var combinedNamespace = namespace1 + "." + namespace2 + "." + namespace3;
        window.simpleDefine(combinedNamespace, [], function () { return marker2; });
        expect(window[namespace1] === marker1).toBe(true);
        expect(window[namespace1][namespace2][namespace3] === marker2).toBe(true);
    });
    it("ignores named dependencies by default", function () {
        expect(window.simpleDefine.isAllowedNamedDependencies).toBe(false);
        var marker1 = "foo";
        var param1;
        window.simpleDefine("ignore", [marker1], function (_param1) {
            param1 = _param1;
        });
        expect(marker1 === param1).toBe(true);
    });
    it("resolves named dependencies if flag set", function () {
        window.simpleDefine.isAllowedNamedDependencies = true;
        var namespace1 = "foo";
        var marker1 = {};
        var param1;
        window.simpleDefine(namespace1, [], function () { return marker1; });
        window.simpleDefine("ignore", [namespace1], function (_param1) {
            param1 = _param1;
            return {};
        });
        expect(marker1 === param1).toBe(true);
        var dependencyEndName = "bar";
        var namespace2 = "myApp.services." + dependencyEndName;
        var marker2 = {};
        window.simpleDefine(namespace2, [], function () { return marker2; });
        var param2;
        window.simpleDefine("ignore", [dependencyEndName], function (_param2) {
            param2 = _param2;
        });
        expect(marker2 === param2).toBe(true);
    });
    it("Clears existing namespace dict on clearNamesResolutionDictionary()", function () {
        window.simpleDefine.isAllowedNamedDependencies = true;
        var namespace1 = "foo";
        var marker1 = {};
        window.simpleDefine(namespace1, [], function () { return marker1; });
        expect(function () { return window.simpleDefine("ignore", [namespace1], function () { }); }).not.toThrow();
        window.simpleDefine.clearNamesResolutionDictionary();
        expect(function () { return window.simpleDefine("ignore", [namespace1], function () { }); }).toThrow();
    });
    it("during named dependencies resolution " +
        "throws if not found or ambiguous", function () {
        window.simpleDefine.isAllowedNamedDependencies = true;
        expect(function () { return window.simpleDefine("ignore", ["nonexistingDependency"], function () { }); }).toThrow();
        var commonName = "user";
        var namespace1 = "myApp.controllers." + commonName;
        var namespace2 = "myApp.services." + commonName;
        window.simpleDefine(namespace1, [], function () { });
        window.simpleDefine(namespace2, [], function () { });
        expect(function () { return window.simpleDefine("ignore", [commonName], function () { }); }).toThrow();
    });
});
//# sourceMappingURL=amd-like-modules.spec.js.map