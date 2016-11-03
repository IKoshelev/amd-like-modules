interface Window {
	simpleDefine: simpleDefine;
	loadOnce: loadOnce
}

interface loadOnce {
	appSubPath: string;
	subPathPlaceholder: string;
	acceptableFileTypesForLink: { [id: string]: string },
	acceptableFileTypesForScript: { [id: string]: string }
	(basePathOrFilesList: (string | string[]), filesList?: string[]): void
}

interface simpleDefine {

	resolveNamedDependenciesByUniqueLastNamespaceCombination: boolean,
	resolveNamedDependenciesInSameNamespaceBranch: boolean;

	resolveModulesReturningPromises: boolean;

	asyncResolutionTimeout: number;

	exposeModulesAsNamespaces: boolean,

	clearInternalNamespaceStructure(): void;
	clearUnresolved(): void;

	(moduleNamespace: String,
		moduleDependencies: any[],
		moduleBody: (...args: any[]) => any,
		allowThrow?: boolean): void;
}

interface ResolutionTempError extends Error {
	isResolutionTempError: boolean,
	failedDependency: string;
}

type failureDesc = {
	moduleNamespace: string,
	failedDependency: string
};

(function (window) {

	enum TreeDictionaryErrorReason{
		NoCandidate,
		MultipleCadidates
	}

	interface TreeDictionaryError{
		reason: TreeDictionaryErrorReason;
	}

	class TreeDictionary {
		
		public static errorReason = TreeDictionaryErrorReason;
		
		private tailSegmentCombinations: { [id: string]: any[] } = {};
		private tree = {};

		private static getPropertyByPath(obj: any, path: string) {
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

		private static removeLastBranchSegmment(branches: string): string {
			var dotIndex = branches.lastIndexOf(".");

			if (dotIndex === -1) {
				return "";
			}

			return branches.slice(0, dotIndex);
		}

		private static removeFirstBranchSegmment(branches: string): string {
			var dotIndex = branches.indexOf(".");

			if (dotIndex === -1) {
				return "";
			}

			return branches.substr(dotIndex + 1);
		}

		public static assignObjToBranchesPath(holderObject: any, branchesPath: string, obj: any) {
			var branchSegments = branchesPath.split(".");

			if (branchSegments.length === 1) {
				(<any>holderObject)[branchSegments[0]] = obj;
				return;
			}

			var currentBranchesPathEndObj = TreeDictionary.getOrCreateObjAtKey(holderObject, branchSegments[0]);

			for (var count1 = 1; count1 < branchSegments.length - 1; count1++) {
				currentBranchesPathEndObj = TreeDictionary.getOrCreateObjAtKey(currentBranchesPathEndObj, branchSegments[count1])
			}

			var finalNamespace = branchSegments[branchSegments.length - 1];
			currentBranchesPathEndObj[finalNamespace] = obj;

		}

		public resolveByTailBranchCombination(baseBranchPath: string, branchPathToResolve: string): any {
			var candidates = this.tailSegmentCombinations[branchPathToResolve];

			if (!candidates) {
				let error = new Error(`Could not resolve '${branchPathToResolve}' for '${baseBranchPath}', no candidates.`);
				(error as any as TreeDictionaryError).reason = TreeDictionary.errorReason.NoCandidate;
				throw error;
			}

			if (candidates.length > 1) {
				let error = new Error(`Could not resolve '${branchPathToResolve}' for '${baseBranchPath}', multiple candidates.`);
				(error as any as TreeDictionaryError).reason = TreeDictionary.errorReason.MultipleCadidates;
				throw error;
			}

			return candidates[0];
		}

		public resolveInSameBranch(baseBranchPath: string, branchPathToResolve: string): any {
			if (!baseBranchPath) {
				return TreeDictionary.getPropertyByPath(this.tree, branchPathToResolve);
			}

			var currentBaseBranchPath = TreeDictionary.removeLastBranchSegmment(baseBranchPath);

			while (currentBaseBranchPath) {
				let currentSearchPath = currentBaseBranchPath + '.' + branchPathToResolve;
				let found = TreeDictionary.getPropertyByPath(this.tree, currentSearchPath);
				if (found) {
					return found;
				}
				currentBaseBranchPath = TreeDictionary.removeLastBranchSegmment(currentBaseBranchPath);
			}

			let found = TreeDictionary.getPropertyByPath(this.tree, branchPathToResolve);
			if (found) {
				return found;
			}
		}

		private createIndexForTailBranchCombinations(branchesPath: string, obj: any) {

			var currentBranch = branchesPath;

			while (currentBranch) {
				this.tailSegmentCombinations[currentBranch] = this.tailSegmentCombinations[currentBranch] || [];
				this.tailSegmentCombinations[currentBranch].push(obj);
				currentBranch = TreeDictionary.removeFirstBranchSegmment(currentBranch);
			}
		}

		private addToTree(branchesPath: string, obj: any) {
			TreeDictionary.assignObjToBranchesPath(this.tree, branchesPath, obj);
		}

		public static getOrCreateObjAtKey(parentObj: any, key: string): any {
			var obj = (parentObj[key] = parentObj[key] || {});
			return obj;
		}

		public add(branchesPath: string, obj: any) {
			this.createIndexForTailBranchCombinations(branchesPath, obj);
			this.addToTree(branchesPath, obj);
		}

		public clear() {
			this.tree = {};
			this.tailSegmentCombinations = {};
		}

	}

	window.simpleDefine = window.simpleDefine || ((window: Window): simpleDefine => {

		var namespaceResolver = new TreeDictionary();

		function verifyArguments(argsArray: any[]) {

			if (argsArray.length != 3) {
				throw new Error("simpleDefine must have 3 arguments.");
			}

			if (typeof argsArray[0] !== "string") {
				throw new Error("simpleDefine first argument must be string namespace.");
			}

			if (Object.prototype.toString.call(argsArray[1]) !== '[object Array]') {
				throw new Error("simpleDefine first argument must be array of dependencies.");
			}

			if (typeof argsArray[2] !== "function") {
				throw new Error("simpleDefine first argument must function containing module definition.");
			}

		}

		function resolveNamedDependencies(dependingModuleNamespace: string, depenenciesArr: any[]): any[] {
			depenenciesArr = depenenciesArr.slice();
			for (var count1 = 0; count1 < depenenciesArr.length; count1++) {
				if (typeof depenenciesArr[count1] !== "string") {
					continue;
				}

				var depToResolve = depenenciesArr[count1];

				if (exports.resolveNamedDependenciesInSameNamespaceBranch) {
					depenenciesArr[count1] = namespaceResolver.resolveInSameBranch(dependingModuleNamespace, depToResolve);
					if (depenenciesArr[count1]) {
						continue;
					}
				}

				if (exports.resolveNamedDependenciesByUniqueLastNamespaceCombination) {
					try {
						depenenciesArr[count1] = namespaceResolver.resolveByTailBranchCombination(dependingModuleNamespace, depToResolve);
					} catch (er){
						if((er as TreeDictionaryError).reason === TreeDictionary.errorReason.NoCandidate){	
							(<ResolutionTempError>er).isResolutionTempError = true;
						}
						throw er;
					}
				}

				if (!depenenciesArr[count1]) {
					let error = <ResolutionTempError>new Error(`Could not resolve '${depToResolve}' for '${dependingModuleNamespace}'`);
					error.failedDependency = depToResolve;
					error.isResolutionTempError = true;
					throw error;
				}

			}
			return depenenciesArr;
		}

		function isAnyResolutionOfNamedDependenciesAllowed() {
			return exports.resolveNamedDependenciesByUniqueLastNamespaceCombination
				|| exports.resolveNamedDependenciesInSameNamespaceBranch;
		};

		function throwIfAnyDependencyUresolved(dependecyArr: any[]) {
			for (var count1 = 0; count1 < dependecyArr.length; count1++) {
				if (!dependecyArr[count1]) {
					throw new Error("Dependency is undefined");
				}
			}
		}

		var modulesWithUnresolvedDependencies: {
			moduleNamespace: string,
			moduleDependencies: any[],
			moduleBody: (...args: any[]) => any,
			lastUnresolvedDependency?: string
		}[] = [];

		function ensureStoredForLaterResoultuion(
			moduleNamespace: string,
			moduleDependencies: any[],
			moduleBody: (...args: any[]) => any,
			failedDependency: string
		) {

			for (var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++) {
				var module = modulesWithUnresolvedDependencies[count1];
				if (module.moduleNamespace === moduleNamespace
					&& moduleDependencies === moduleDependencies
					&& moduleBody === moduleBody) {
					module.lastUnresolvedDependency = failedDependency;
					return;
				}
			}

			modulesWithUnresolvedDependencies.push({
				moduleNamespace,
				moduleBody,
				moduleDependencies,
				lastUnresolvedDependency: failedDependency
			});
		}

		function removeModuleStoredForLaterResolution(module: any) {
			for (var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++) {
				if (module === modulesWithUnresolvedDependencies[count1]) {
					modulesWithUnresolvedDependencies.splice(count1, 1);
					return;
				}
			}
		}

		var finalResolveAttemptTimeoutId: number;
		function debounceFinalResolveAttempt() {
			clearDebouncedResolve();
			finalResolveAttemptTimeoutId = window.setTimeout(finalReolveAttempt, exports.asyncResolutionTimeout);
		}

		function clearDebouncedResolve() {
			if (finalResolveAttemptTimeoutId) {
				window.clearTimeout(finalResolveAttemptTimeoutId);
				finalResolveAttemptTimeoutId = undefined;
			}
		}

		function mapUnresolvedModulesForThrow() {

			var result: failureDesc[] = [];

			for (var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++) {

				var module = modulesWithUnresolvedDependencies[count1];

				var failureDesc: failureDesc = {
					moduleNamespace: module.moduleNamespace,
					failedDependency: module.lastUnresolvedDependency
				};

				result.push(failureDesc);

			}
			return result;
		}

		function finalReolveAttempt() {
			if (modulesWithUnresolvedDependencies.length === 0) {
				return;
			}
			var anySuccess = tryResolveUnresolvedModules();
			if (!anySuccess) {
				var uresolved = mapUnresolvedModulesForThrow();
				throw new Error(
					"Async resolution timeout passed, still some modules unresolved; \r\n" +
					JSON.stringify(uresolved)
				);
			}
			finalReolveAttempt();
		}

		function tryResolveUnresolvedModules() {
			var anySuccess = false;
			var modulesToResolve = modulesWithUnresolvedDependencies.slice();
			for (var count1 = 0; count1 < modulesToResolve.length; count1++) {
				var module = modulesToResolve[count1];
				try {
					exports(
						module.moduleNamespace,
						module.moduleDependencies,
						module.moduleBody,
						true);
					anySuccess = true;
					removeModuleStoredForLaterResolution(module);

				}
				catch (err) {
					if (!(<ResolutionTempError>err).isResolutionTempError) {
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
												moduleBody: (...args: any[]) => any,
												allowThrow: boolean = false) {
			var resolveDependencies: any[];
			try {
				if (isAnyResolutionOfNamedDependenciesAllowed()) {
					resolveDependencies = resolveNamedDependencies(moduleNamespace, moduleDependencies);
				} else {
					resolveDependencies = moduleDependencies;
				}
				throwIfAnyDependencyUresolved(resolveDependencies);
			}
			catch (err) {
				if (allowThrow
					|| exports.asyncResolutionTimeout == 0
					|| !(<ResolutionTempError>err).isResolutionTempError) {
					throw err;
				}
				ensureStoredForLaterResoultuion(
					moduleNamespace,
					moduleDependencies,
					moduleBody,
					(<ResolutionTempError>err).failedDependency);
				debounceFinalResolveAttempt();
				return;
			}

			return resolveDependencies;
		}

		function storeBodyAndTryExecutingDependentsForNamedModule(
			moduleNamespace: string,
			moduleOutput: any) {

			namespaceResolver.add(moduleNamespace, moduleOutput);

			if (exports.exposeModulesAsNamespaces) {
				TreeDictionary.assignObjToBranchesPath(window, moduleNamespace, moduleOutput);
			}

			window.setTimeout(tryResolveUnresolvedModules);
		}

		var exports: simpleDefine = <any>function (
			moduleNamespace: string,
			moduleDependencies: any[],
			moduleBody: (...args: any[]) => any,
			allowThrow: boolean = false) {

			var moduleArgs: any[] = Array.prototype.slice.call(arguments, 0, 3);
			verifyArguments(moduleArgs);

			var resolvedDependencies =
				resolveDependenciesOrStoreForLater(moduleNamespace,
					moduleDependencies,
					moduleBody,
					allowThrow);
			if (!resolvedDependencies) {
				return;
			}

			var moduleOutput = moduleBody(...resolvedDependencies);

			if (!moduleNamespace) {
				return;
			}

			if (exports.resolveModulesReturningPromises
				&& moduleOutput
				&& moduleOutput.then) {
				moduleOutput.then(
					(resolvedBody: any) => storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, resolvedBody))
					.done();
				return;
			}

			storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, moduleOutput);
		};

		exports.resolveNamedDependenciesByUniqueLastNamespaceCombination = false;
		exports.resolveNamedDependenciesInSameNamespaceBranch = false;
		exports.resolveModulesReturningPromises = false;

		exports.asyncResolutionTimeout = 0;

		exports.exposeModulesAsNamespaces = true;

		exports.clearInternalNamespaceStructure = function () {
			namespaceResolver.clear();
		}

		exports.clearUnresolved = () => {
			clearDebouncedResolve();
			modulesWithUnresolvedDependencies = [];
		};

		return exports;
	})(window);

	window.loadOnce = window.loadOnce || ((window: Window): loadOnce => {

		function isStringOrNothing(x: any) {
			return typeof x == 'string' || typeof x == 'undefined' || x === null;
		}

		function isArray<T>(subject: any, perItemCheck?: (item: any) => boolean): subject is Array<T> {
			if (Object.prototype.toString.call(subject) !== '[object Array]') {
				return false;
			}
			if (!perItemCheck) {
				return true;
			}
			for (var count1 = 0; count1 < subject.length; count1++) {
				if (!perItemCheck(subject[count1])) {
					return false;
				}
			}
			return true;
		}

		function replacePlaceholderAtTheBeginingWithAppSubPath(path: string): string {
			if (exports.subPathPlaceholder
				&& exports.appSubPath
				&& path.lastIndexOf(exports.subPathPlaceholder, 0) === 0) {
				path = path.replace(exports.subPathPlaceholder, exports.appSubPath);
			}
			return path;
		}

		function endsWith(str: string, suffix: string) {
			return str.indexOf(suffix, str.length - suffix.length) !== -1;
		};

		function findRecordMatchingEndingInDict(dict: { [id: string]: string }, path: string) {
			for (var key in dict) {
				if (dict.hasOwnProperty(key) == false) {
					continue;
				}
				if (endsWith(path.toUpperCase(), key.toUpperCase())) {
					return dict[key];
				}
			}
		}

		function loadFileOnce(basePath: string, filePath: string) {
			var path = basePath + filePath;

			if (!path) {
				return;
			}

			path = replacePlaceholderAtTheBeginingWithAppSubPath(path);
			var scriptTypeMatch = findRecordMatchingEndingInDict(exports.acceptableFileTypesForScript, path);
			if (scriptTypeMatch) {
				loadScriptOnce(path, scriptTypeMatch);
				return;
			}

			var linkRelMatch = findRecordMatchingEndingInDict(exports.acceptableFileTypesForLink, path);
			if (linkRelMatch) {
				loadLinkOnce(path, linkRelMatch);
				return;
			}

			throw new Error("File type could not be recognized for path :" + path);

		}

		function loadScriptOnce(path: string, scriptType: string) {

			var newTag = document.createElement('script');
			newTag.type = scriptType;
			newTag.src = path;

			var scriptTags = document.getElementsByTagName('script');

			for (var count1 = 0; count1 < scriptTags.length; count1++) {
				if (scriptTags[count1].src.toLowerCase() === newTag.src.toLowerCase()) {
					return;
				}
			}

			document.getElementsByTagName('head')[0].appendChild(newTag);
		}

		function loadLinkOnce(path: string, linkRel: string) {

			var newTag = document.createElement('link');
			newTag.rel = linkRel;
			newTag.href = path;

			var linkTags = document.getElementsByTagName('link');

			for (var count1 = 0; count1 < linkTags.length; count1++) {
				if (linkTags[count1].href.toLowerCase() === newTag.href.toLocaleLowerCase()) {
					return;
				}
			}

			document.getElementsByTagName('head')[0].appendChild(newTag);
		}

		var exports: loadOnce = <loadOnce>function loadOnce(basePathOrFilesList: (string | string[]), filesList?: string[]): void {

			if (isArray<string>(basePathOrFilesList, isStringOrNothing)) {
				return loadOnce("", basePathOrFilesList);
			} else if (typeof basePathOrFilesList != 'string' || isArray<string>(filesList, isStringOrNothing) == false) {
				throw new Error("loadOnce has invalid arguments. Must have either (filesList:string[]) or (basePath:string, filesList:string[])")
			}

			var basePath = <string>basePathOrFilesList;

			for (var count1 = 0; count1 < filesList.length; count1++) {
				loadFileOnce(basePath, filesList[count1]);
			}
		}

		exports.subPathPlaceholder = "~";
		exports.acceptableFileTypesForLink = {
			".css": "stylesheet"
		}
		exports.acceptableFileTypesForScript = {
			".js": "text/javascript"
		}

		return exports;
	})(window);

})(window)