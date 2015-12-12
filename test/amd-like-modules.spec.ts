/// <reference path="../typings/tsd.d.ts" />

describe("amd-like-modules",()=>{
	
	var namespace1 = "foo";
	var namespace2 = "bar";
	var namespace3 = "baz";
	var namesapceIgnore = "ignore";
	var marker1 = {};
	var marker2 = {};
	var marker3 = {};
	var param1:any;
	var param2:any;
	var param3:any;
	
	afterEach(() => {
		window.simpleDefine.isAllowedExposeModulesAsNamespaces = true;
		window.simpleDefine.isAllowedNamedDependencies = false;
		
		window.simpleDefine.clearInternalNamespaceStructure();
		
		[namespace1,namespace2,namespace3,namesapceIgnore].forEach((ns) =>{
			delete (<any>window)[ns];
		});
		marker1 = {};
		marker2 = {};
		marker3 = {};
		param1 = param2 = param3 = undefined;
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
		
		window.simpleDefine(namesapceIgnore,
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
	
	it("by default exposes module output on window object via namespaces," +
		" preserving preexisting namesapces",()=>{
		
		window.simpleDefine(namespace1,[],()=>marker1);
		
		expect((<any>window)[namespace1] === marker1).toBe(true);

		var combinedNamespace = `${namespace1}.${namespace2}.${namespace3}`; 	
		
		window.simpleDefine(combinedNamespace,[],()=>marker2);
		
		expect((<any>window)[namespace1] === marker1).toBe(true);
		expect((<any>window)[namespace1][namespace2][namespace3] === marker2).toBe(true);
	
	});
	
	it("can turn off exposing modules as namespaces",()=>{
		window.simpleDefine.isAllowedExposeModulesAsNamespaces = false;
				
		window.simpleDefine(namespace1,[],()=>marker1);
		
		expect((<any>window)[namespace1]).not.toBeDefined();
	});
	
	it("ignores named dependencies by default",()=>{
		
		expect(window.simpleDefine.isAllowedNamedDependencies).toBe(false);
		
		var marker1 = "foo";
		var param1: string;
		
		window.simpleDefine(namesapceIgnore,[marker1],(_param1)=>{
			param1 = _param1;
		});
		
		expect(marker1 === param1).toBe(true);
		
	});
	
	function dependecyResolutionTest(testCase:boolean){
		window.simpleDefine.isAllowedExposeModulesAsNamespaces = testCase;
		window.simpleDefine.isAllowedNamedDependencies = true;
		 		
		// 1 namespace in chain - simple case
		window.simpleDefine(namespace1,[],()=>marker1); 
		window.simpleDefine(namesapceIgnore,[namespace1],(_param1)=>{
			param1 = _param1;
			return {};
		});
		
		expect(marker1 === param1).toBe(true);
		
		// multiple segments in chain
		var lastNamespace = "bax";
		var beforelastNamespace = "services";
		var fullNamespace = `${namespace2}.${beforelastNamespace}.${lastNamespace}`;
		window.simpleDefine(fullNamespace,[],()=>marker2);
		
		window.simpleDefine(namesapceIgnore,[lastNamespace],(_param2)=>{
			param2 = _param2;
		});
		expect(marker2 === param2).toBe(true);
		
		window.simpleDefine(namesapceIgnore,[fullNamespace],(_param3)=>{
			param3 = _param3;
		});
		expect(marker2 === param3).toBe(true);
	} 
	
	it("resolves named dependencies if flag is set",()=>{
		dependecyResolutionTest(true);
	});
	
	it("resolves named dependencies if flag is set," 
	    + " even when namespace are not exposed on window",()=>{
		dependecyResolutionTest(false);
	});
	
	it("Clears existing namespace dict on clearNamesResolutionDictionary()",()=>{
		window.simpleDefine.isAllowedNamedDependencies = true;
		
		window.simpleDefine(namespace1,[],()=>marker1); 
		
		expect(() => window.simpleDefine(namesapceIgnore,[namespace1],()=>{})).not.toThrow();
		
		window.simpleDefine.clearInternalNamespaceStructure();
		
		expect(() => window.simpleDefine(namesapceIgnore,[namespace1],()=>{})).toThrow();
	});
	
	it("during named dependencies resolution " + 
	 	"throws if not found or ambiguous",()=>{
			 
			 window.simpleDefine.isAllowedNamedDependencies = true;
			 expect(() => window.simpleDefine(namesapceIgnore,["nonexistingDependency"],()=>{})).toThrow();

			 var commonName = "user";
			 var firstCandidateNs = `${namespace1}.controllers.${commonName}`;
			 var secondCandidateNs = `${namespace2}.services.${commonName}`;
			 
			 window.simpleDefine(firstCandidateNs,[],()=>{});
			 window.simpleDefine(secondCandidateNs,[],()=>{});
			 
			 expect(() => window.simpleDefine(namesapceIgnore,[commonName],()=>{})).toThrow();
		 });
});