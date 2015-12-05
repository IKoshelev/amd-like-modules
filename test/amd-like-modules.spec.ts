/// <reference path="../typings/tsd.d.ts" />

describe("amd-like-modules",()=>{
	
	it("should provide simpleDefine function on window object",()=>{
		expect(window.simpleDefine).toBeDefined();
		expect(typeof window.simpleDefine).toBe("function");
	});
	
	
	
});