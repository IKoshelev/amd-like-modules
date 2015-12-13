interface Window {
	simpleDefine: simpleDefine;
}

interface simpleDefine{
		 
		resolveNamedDependenciesByUniqueLastNamespaceCombination: boolean,
		resolveNamedDependenciesInSameNamespaceBranch: boolean;
		
		asyncResolutionTimeout: number;

		exposeModulesAsNamespaces: boolean,
		
		clearInternalNamespaceStructure():void;
		clearUnresolved():void;
		
		(moduleNamespace: String, 
		moduleDependencies: any[], 
		moduleBody: (...args: any[])=>any,
		allowThrow?: boolean):void;
	}
	
interface ResolutionPermanentError extends Error{
	isResolutionPermanentError: boolean;
}

window.simpleDefine = ((window:Window):simpleDefine =>{ 
	
	function verifyArguments(argsArray: any[]){

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
	
	function resolveDependencyByUniqueLastNamespaceCombination(name:string):any{
		var candidates = moduleNsTailCombinationsDict[name];

		if(!candidates){
			throw new Error(`Could not resolve '${name}', no modules end in this combination of namepsaces.`);
		}
		
		if(candidates.length > 1){
			var error = new Error(`Could not resolve '${name}', multiple modules end in this combination of namepsaces.`);
			(<ResolutionPermanentError>error).isResolutionPermanentError = true;
			throw error;	
		}
		
		return candidates[0];
	}
	
	function resolveDependencyInSameNamespaceBranch(dependingModuleNamespace:string, name:string):any{
		if(!dependingModuleNamespace){
			return getPropertyByPath(internalNamespaceTreeHolder, name);
		}
		
		var currentNsBranch = removeLastNsSegmment(dependingModuleNamespace);
		
		while(currentNsBranch){
			let currentSearchPath = currentNsBranch + '.' + name;
			let resolvedDependency =  getPropertyByPath(internalNamespaceTreeHolder, currentSearchPath);
			if(resolvedDependency){
				return resolvedDependency;
			}
			currentNsBranch = removeLastNsSegmment(currentNsBranch);
		}
		
		let resolvedDependency =  getPropertyByPath(internalNamespaceTreeHolder, name);
		if(resolvedDependency){
			return resolvedDependency;
		}
	}
	
	function getPropertyByPath(obj:any, path:string){
		var props = path.split('.')
    	var current = obj;

		for (var count1 = 0; count1 < props.length; ++count1) {
			if (current[props[count1]] == undefined) {
				return undefined;
			} else {
				current = current[props[count1]];
			}
		}
		
  		return current;
	}
		
	function resolveNamedDependencies(dependingModuleNamespace:string, depenenciesArr: any[]):any[]{
		depenenciesArr = depenenciesArr.slice();
		for(var count1 = 0; count1 < depenenciesArr.length; count1++){
			if(typeof depenenciesArr[count1] !== "string"){
				continue;	
			}
			
			var depToResolve = depenenciesArr[count1];

			
			if(exports.resolveNamedDependenciesInSameNamespaceBranch){
				depenenciesArr[count1] = resolveDependencyInSameNamespaceBranch(dependingModuleNamespace, depToResolve);
				if(depenenciesArr[count1]){
					continue;
				}
			}
			
			if(exports.resolveNamedDependenciesByUniqueLastNamespaceCombination){
				depenenciesArr[count1] = resolveDependencyByUniqueLastNamespaceCombination(depToResolve);
			}
			
			if(!depenenciesArr[count1]){
				throw new Error("Could not resolve named dependecy "  + depToResolve);
			}
			
		}
		return depenenciesArr;
	}
	
	function getOrCreateNamespace(parentNamespace:any, namespaceName: string ):any{

		var namespace = (parentNamespace[namespaceName] = parentNamespace[namespaceName] || {});
		return namespace;	
	}
	
	var moduleNsTailCombinationsDict:{[id:string]:any[]} = {};
	function storeModuleNsTailCombinationsForQniqueTailNsResolution(moduleNamespace: string,moduleOutput: any){
		
		var currentName = moduleNamespace;
		
		while(currentName){
			moduleNsTailCombinationsDict[currentName] = moduleNsTailCombinationsDict[currentName] || []; 
			moduleNsTailCombinationsDict[currentName].push(moduleOutput);
			currentName = removeFirstNsSegmment(currentName);
		}
	}
	
	function removeFirstNsSegmment(namespaces:string):string{
		var dotIndex = namespaces.indexOf(".");
		
		if(dotIndex === -1){
			return "";
		}
		
		return namespaces.substr(dotIndex + 1);
	}
	
	function removeLastNsSegmment(namespaces:string):string{
		var dotIndex = namespaces.lastIndexOf(".");
		
		if(dotIndex === -1){
			return "";
		}
		
		return namespaces.slice(0, dotIndex);
	}
	
	var internalNamespaceTreeHolder = {};
	function assignOutputToNamespace(holderObject: any, moduleNamespace: string,moduleOutput: any){
		var namespaceSegments = moduleNamespace.split(".");

		if(namespaceSegments.length === 1){
			(<any>holderObject)[namespaceSegments[0]] = moduleOutput;
			return;
		}
		
		var currentNamepaceObj = getOrCreateNamespace(holderObject,namespaceSegments[0]);
					
		for(var count1 = 1; count1 < namespaceSegments.length - 1; count1++){
			currentNamepaceObj = getOrCreateNamespace(currentNamepaceObj,namespaceSegments[count1])	
		}
		
		var finalNamespace = namespaceSegments[namespaceSegments.length - 1];
		currentNamepaceObj[finalNamespace] = moduleOutput;
		
	}
	
	function isAnyResolutionOfNamedDependenciesAllowed(){
		return exports.resolveNamedDependenciesByUniqueLastNamespaceCombination
			|| exports.resolveNamedDependenciesInSameNamespaceBranch;
	};
	
	function throwIfAnyDependencyUresolved(dependecyArr: any[]){
		for(var count1 = 0; count1 < dependecyArr.length; count1++){
			if(!dependecyArr[count1]){
				throw new Error("Dependency is undefined");
			}	
		}
	}
	
	var modulesWithUnresolvedDependencies: {
			moduleNamespace: string, 
			moduleDependencies: any[], 
			moduleBody: (...args: any[])=>any}[] = [];
	
	function ensureStoredForLaterResoultuion(
			moduleNamespace: string, 
			moduleDependencies: any[], 
			moduleBody: (...args: any[])=>any	
		){

			for(var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++){
				var module = modulesWithUnresolvedDependencies[count1];
				if(module.moduleNamespace === moduleNamespace
					&& moduleDependencies === moduleDependencies
					&& moduleBody === moduleBody){
						return;
					}
			}

			modulesWithUnresolvedDependencies.push({
						moduleNamespace,
						moduleBody,
						moduleDependencies});
	}
	
		function removeModuleStoredForLaterResolution(module:any){
			for(var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++){
				if(module === modulesWithUnresolvedDependencies[count1]){
					modulesWithUnresolvedDependencies.splice(count1,1);
					return;
				}
			}
	}
	
	var finalResolveAttemptTimeoutId:number;
	function debounceFinalResolveAttempt(){
		clearDebouncedResolve();
		finalResolveAttemptTimeoutId = window.setTimeout(finalReolveAttempt,exports.asyncResolutionTimeout);
	}
	
	function clearDebouncedResolve(){
		if(finalResolveAttemptTimeoutId){
			window.clearTimeout(finalResolveAttemptTimeoutId);
			finalResolveAttemptTimeoutId = undefined;
		}
	}
	
	function finalReolveAttempt(){
		if(modulesWithUnresolvedDependencies.length === 0){
			return;
		}
		var anySuccess = tryResolveUnresolvedModules();
		if(!anySuccess){
			throw new Error("Async resolution timeout passed, still some modules unresolved");
		}
		finalReolveAttempt();
	}
	
	function tryResolveUnresolvedModules(){
		var anySuccess = false;
		var modulesToResolve = modulesWithUnresolvedDependencies.slice();
		for(var count1 = 0; count1 < modulesToResolve.length; count1++){
			var module = modulesToResolve[count1];
			try{
				exports(
					module.moduleNamespace,
					module.moduleDependencies,
					module.moduleBody,
					true);
				anySuccess = true;
				removeModuleStoredForLaterResolution(module);
				
			}
			catch(err){
				if((<ResolutionPermanentError>err).isResolutionPermanentError){
					removeModuleStoredForLaterResolution(module);
					throw err;
				}
			}
		}
		
		return anySuccess;
	}
	
	function resolveDependenciesOrStoreForLater(
												moduleNamespace: string, 
												moduleDependencies: any[], 
												moduleBody: (...args: any[])=>any,
												allowThrow:boolean = false){
		var resolveDependencies:any[];
		try{
			if(isAnyResolutionOfNamedDependenciesAllowed()){
				resolveDependencies = resolveNamedDependencies(moduleNamespace, moduleDependencies);
			} else {
				resolveDependencies = moduleDependencies;	
			}
			throwIfAnyDependencyUresolved(resolveDependencies);
		}
		catch(err){
			if(allowThrow 
			|| exports.asyncResolutionTimeout == 0
			|| (<ResolutionPermanentError>err).isResolutionPermanentError){
				throw err;
			}
			ensureStoredForLaterResoultuion(
				moduleNamespace,
				moduleDependencies,
				moduleBody);
			debounceFinalResolveAttempt();
			return;
		}
		return resolveDependencies;
	}
		 
	var exports:simpleDefine = <any>function(
				moduleNamespace: string, 
				moduleDependencies: any[], 
				moduleBody: (...args: any[])=>any,
				allowThrow:boolean = false){
					
					var moduleArgs:any[] = Array.prototype.slice.call(arguments,0,3);
					verifyArguments(moduleArgs);
					
					var resolvedDependencies= 
						resolveDependenciesOrStoreForLater(moduleNamespace,
															moduleDependencies,
															moduleBody,
															allowThrow);
					if(!resolvedDependencies){
						return;
					}

					var moduleOutput = moduleBody(...resolvedDependencies);
						 
					if(!moduleNamespace){
						return;
					}
					
					storeModuleNsTailCombinationsForQniqueTailNsResolution(moduleNamespace,moduleOutput);
					assignOutputToNamespace(internalNamespaceTreeHolder, moduleNamespace,moduleOutput);
					if(exports.exposeModulesAsNamespaces){
						assignOutputToNamespace(window,moduleNamespace,moduleOutput);
					}

					window.setTimeout(tryResolveUnresolvedModules);		
				};
				
	exports.resolveNamedDependenciesByUniqueLastNamespaceCombination = false;
	exports.resolveNamedDependenciesInSameNamespaceBranch = false;
	
	exports.asyncResolutionTimeout = 0;
	
	exports.exposeModulesAsNamespaces = true;
	
	exports.clearInternalNamespaceStructure = function(){
		moduleNsTailCombinationsDict = {};
		internalNamespaceTreeHolder = {};
	}
	
	exports.clearUnresolved = () =>{
		clearDebouncedResolve();
		modulesWithUnresolvedDependencies = [];
	};
	
	return exports;
})(window); 