/// <reference path="../typings/tsd.d.ts" />

describe("amd-like-modules",()=>{
	
	afterEach(() => {
		window.simpleDefine.clearNamesResolutionDictionary();
	});
		
	it("should provide simpleDefine function on window object",()=>{
		expect(window.simpleDefine).toBeDefined();
		expect(typeof window.simpleDefine).toBe("function");
	});
	
	it("should throw unless 3 arguments (string,[],function)",()=>{
		expect(() => (<any>window.simpleDefine)("",[],()=>{})).not.toThrow();		
		expect(() => (<any>window.simpleDefine)("",{},()=>{})).toThrow();
		expect(() => (<any>window.simpleDefine)({},[],()=>{})).toThrow();
		expect(() => (<any>window.simpleDefine)("",[],{})).toThrow();
		expect(() => (<any>window.simpleDefine)()).toThrow();
		    
	});
	
	it("executes module body, passing in dependencies",()=>{
		var marker1 = {};
		var param1:any;
		var marker2 = {};
		var param2:any;
		var marker3 = {};
		var param3:any;
		
		window.simpleDefine("ignore",
			[marker1,null,marker2,marker3],
			function(_param1,ignore,_param2){
				param1 = _param1;
				param2 = _param2;
				param3 = arguments[3];
			});

		expect(marker1 === param1).toBe(true);
		expect(marker2 === param2).toBe(true);
		expect(marker3 === param3).toBe(true);
		
	});
	
	it("exposes module output on window object via namespaces," +
		" preserving preexisting namesapces",()=>{
		var marker1 = {};
		var namespace1 = "foo";
		
		window.simpleDefine(namespace1,[],()=>marker1);
		
		expect((<any>window)[namespace1] === marker1).toBe(true);
		
		var marker2 = {};
		var namespace2 = "bar";
		var namespace3 = "baz";
		var combinedNamespace = `${namespace1}.${namespace2}.${namespace3}`; 	
		
		window.simpleDefine(combinedNamespace,[],()=>marker2);
		
		expect((<any>window)[namespace1] === marker1).toBe(true);
		expect((<any>window)[namespace1][namespace2][namespace3] === marker2).toBe(true);
	
	});
	
	it("ignores named dependencies by default",()=>{
		
		expect(window.simpleDefine.isAllowedNamedDependencies).toBe(false);
		
		var marker1 = "foo";
		var param1: string;
		
		window.simpleDefine("ignore",[marker1],(_param1)=>{
			param1 = _param1;
		});
		
		expect(marker1 === param1).toBe(true);
		
	});
	
	it("resolves named dependencies if flag set",()=>{
		
		window.simpleDefine.isAllowedNamedDependencies = true;
		 
		var namespace1 = "foo";
		var marker1 = {};
		var param1:any;
		
		window.simpleDefine(namespace1,[],()=>marker1); 
		window.simpleDefine("ignore",[namespace1],(_param1)=>{
			param1 = _param1;
			return {};
		});
		
		expect(marker1 === param1).toBe(true);
		
		var lastNamespace = "bar";
		var beforelastNamespace = "services";
		var namespace2 = `myApp.${beforelastNamespace}.${lastNamespace}`;
		var marker2 = {};
		window.simpleDefine(namespace2,[],()=>marker2);
		
		var param2:any;
		window.simpleDefine("ignore",[lastNamespace],(_param2)=>{
			param2 = _param2;
		});
		expect(marker2 === param2).toBe(true);
		
		var param3:any;
		window.simpleDefine("ignore",[`myApp.${beforelastNamespace}.${lastNamespace}`],(_param3)=>{
			param3 = _param3;
		});
		expect(marker2 === param3).toBe(true);
		
	});
	
	it("Clears existing namespace dict on clearNamesResolutionDictionary()",()=>{
		window.simpleDefine.isAllowedNamedDependencies = true;
		 
		var namespace1 = "foo";
		var marker1 = {};
		
		window.simpleDefine(namespace1,[],()=>marker1); 
		
		expect(() => window.simpleDefine("ignore",[namespace1],()=>{})).not.toThrow();
		
		window.simpleDefine.clearNamesResolutionDictionary();
		
		expect(() => window.simpleDefine("ignore",[namespace1],()=>{})).toThrow();
	});
	
	it("during named dependencies resolution " + 
	 	"throws if not found or ambiguous",()=>{
			 
			 window.simpleDefine.isAllowedNamedDependencies = true;
			 expect(() => window.simpleDefine("ignore",["nonexistingDependency"],()=>{})).toThrow();

			 var commonName = "user";
			 var namespace1 = `myApp.controllers.${commonName}`;
			 var namespace2 = `myApp.services.${commonName}`;
			 
			 window.simpleDefine(namespace1,[],()=>{});
			 window.simpleDefine(namespace2,[],()=>{});
			 
			 expect(() => window.simpleDefine("ignore",[commonName],()=>{})).toThrow();
		 });
});