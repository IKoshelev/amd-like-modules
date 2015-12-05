interface Window {
	simpleDefine: simpleDefine;
}

interface simpleDefine{
		
		isAllowedNamedDependencies: boolean,
		clearNamesResolutionDictionary():void;
		
		(moduleNamespace: String, 
		moduleDependencies: any[], 
		moduleBody: (...args: any[])=>any):void;
	}

window.simpleDefine = ((window:Window):simpleDefine =>{ 
	
	function verifyArguments(argsArray: IArguments){

		if(argsArray.length != 3){
			throw new Error("simpleDefine must have 3 arguments.");
		}
		
		if(typeof argsArray[0] !== "string"){
			throw new Error("simpleDefine first argument must be string namespace.");
		}
		
		if(Object.prototype.toString.call(argsArray[1]) !== '[object Array]'){
			throw new Error("simpleDefine first argument must be array of dependencies.");
		}
		
		if(typeof argsArray[2] !== "function"){
			throw new Error("simpleDefine first argument must function containing module definition.");
		}
		
	}
	
	function resolveDependencyByName(name:string):any{
		var candidates = moduleNamesResolutionDictionary[name];
		if(!candidates){
			throw new Error(`Could not resolve '${name}', no modules end in this combination of namepsaces.`);
		}
		
		if(candidates.length > 1){
			throw new Error(`Could not resolve '${name}', multiple modules end in this combination of namepsaces.`);
		}
		
		return candidates[0];
	}
	
	function resolveNamedDependenciesIfAllowed(depenenciesArr: any[]):any[]{
		
		if(window.simpleDefine.isAllowedNamedDependencies == false){
			return depenenciesArr;
		}
		return resolveNamedDependencies(depenenciesArr);
	}
	
	function resolveNamedDependencies(depenenciesArr: any[]):any[]{
		for(var count1 = 0; count1 < depenenciesArr.length; count1++){
			if(typeof depenenciesArr[count1] === "string"){
				depenenciesArr[count1] = resolveDependencyByName(depenenciesArr[count1]);
			}
		}
		return depenenciesArr;
	}
	
	function getOrCreateNamespace(parentNamespace:any, namespaceName: string ):any{

		var namespace = (parentNamespace[namespaceName] = parentNamespace[namespaceName] || {});
		return namespace;	
	}
	
	var moduleNamesResolutionDictionary:{[id:string]:any[]} = {};
	function storeDependencyForStringNameResolution(moduleNamespace: string,moduleOutput: any){
		
		var currentName = moduleNamespace;
		
		while(currentName){
			moduleNamesResolutionDictionary[currentName] = moduleNamesResolutionDictionary[currentName] || []; 
			moduleNamesResolutionDictionary[currentName].push(moduleOutput);
			currentName = removeFirstSegmment(currentName);
		}
		
		
	}
	
	function removeFirstSegmment(namespaces:string):string{
		var dotIndex = namespaces.indexOf(".");
		
		if(dotIndex === -1){
			return "";
		}
		
		return namespaces.substr(dotIndex + 1);
	}
	
	function assignOutputToNamespaceOnWindow(moduleNamespace: string,moduleOutput: any){
		var namespaceSegments = moduleNamespace.split(".");

		if(namespaceSegments.length === 1){
			(<any>window)[namespaceSegments[0]] = moduleOutput;
		}
		
		var currentNamepaceObj = getOrCreateNamespace(window,namespaceSegments[0]);
					
		for(var count1 = 1; count1 < namespaceSegments.length - 1; count1++){
			currentNamepaceObj = getOrCreateNamespace(currentNamepaceObj,namespaceSegments[count1])	
		}
		
		var finalNamespace = namespaceSegments[namespaceSegments.length - 1];
		currentNamepaceObj[finalNamespace] = moduleOutput;
		
	}
		 
	var exports:simpleDefine = <any>function(
				moduleNamespace: string, 
				moduleDependencies: any[], 
				moduleBody: (...args: any[])=>any){
					
					verifyArguments(arguments);
					
					var resolveDependencies = resolveNamedDependenciesIfAllowed(moduleDependencies);
	
					var moduleOutput = moduleBody(...resolveDependencies);
					
					storeDependencyForStringNameResolution(moduleNamespace,moduleOutput);
					assignOutputToNamespaceOnWindow(moduleNamespace,moduleOutput);
					
				};
	exports.isAllowedNamedDependencies = false;
	
	exports.clearNamesResolutionDictionary = function(){
		moduleNamesResolutionDictionary = {};
	}
	
	return exports;
})(window); 