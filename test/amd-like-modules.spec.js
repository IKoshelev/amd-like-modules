/// <reference path="../typings/tsd.d.ts" />
describe("amd-like-modules", function () {
    it("should provide simpleDefine function on window object", function () {
        expect(window.simpleDefine).toBeDefined();
        expect(typeof window.simpleDefine).toBe("function");
    });
});
//# sourceMappingURL=amd-like-modules.spec.js.map