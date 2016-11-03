var TreeDictionaryErrorReason;
(function (TreeDictionaryErrorReason) {
    TreeDictionaryErrorReason[TreeDictionaryErrorReason["NoCandidate"] = 0] = "NoCandidate";
    TreeDictionaryErrorReason[TreeDictionaryErrorReason["MultipleCadidates"] = 1] = "MultipleCadidates";
})(TreeDictionaryErrorReason || (TreeDictionaryErrorReason = {}));
var TreeDictionary = (function () {
    function TreeDictionary() {
        this.tailBranchSegmentCombinations = {};
        this.tree = {};
    }
    TreeDictionary.getPropertyByPath = function (obj, path) {
        var props = path.split('.');
        var current = obj;
        for (var count1 = 0; count1 < props.length; ++count1) {
            if (current[props[count1]] == undefined) {
                return undefined;
            }
            else {
                current = current[props[count1]];
            }
        }
        return current;
    };
    TreeDictionary.removeLastBranchSegmment = function (branches) {
        var dotIndex = branches.lastIndexOf(".");
        if (dotIndex === -1) {
            return "";
        }
        return branches.slice(0, dotIndex);
    };
    TreeDictionary.removeFirstBranchSegmment = function (branches) {
        var dotIndex = branches.indexOf(".");
        if (dotIndex === -1) {
            return "";
        }
        return branches.substr(dotIndex + 1);
    };
    TreeDictionary.assignObjToBranchesPath = function (holderObject, branchesPath, obj) {
        var branchSegments = branchesPath.split(".");
        if (branchSegments.length === 1) {
            holderObject[branchSegments[0]] = obj;
            return;
        }
        var currentBranchesPathEndObj = TreeDictionary.getOrCreateObjAtKey(holderObject, branchSegments[0]);
        for (var count1 = 1; count1 < branchSegments.length - 1; count1++) {
            currentBranchesPathEndObj = TreeDictionary.getOrCreateObjAtKey(currentBranchesPathEndObj, branchSegments[count1]);
        }
        var finalNamespace = branchSegments[branchSegments.length - 1];
        currentBranchesPathEndObj[finalNamespace] = obj;
    };
    TreeDictionary.prototype.resolveByTailBranchCombination = function (baseBranchPath, branchPathToResolve) {
        var candidates = this.tailBranchSegmentCombinations[branchPathToResolve];
        if (!candidates) {
            var error = new Error("Could not resolve '" + branchPathToResolve + "' for '" + baseBranchPath + "', no candidates.");
            error.reason = TreeDictionary.errorReason.NoCandidate;
            throw error;
        }
        if (candidates.length > 1) {
            var error = new Error("Could not resolve '" + branchPathToResolve + "' for '" + baseBranchPath + "', multiple candidates.");
            error.reason = TreeDictionary.errorReason.MultipleCadidates;
            throw error;
        }
        return candidates[0];
    };
    TreeDictionary.prototype.resolveInSameBranch = function (baseBranchPath, branchPathToResolve) {
        if (!baseBranchPath) {
            return TreeDictionary.getPropertyByPath(this.tree, branchPathToResolve);
        }
        var currentBaseBranchPath = TreeDictionary.removeLastBranchSegmment(baseBranchPath);
        while (currentBaseBranchPath) {
            var currentSearchPath = currentBaseBranchPath + '.' + branchPathToResolve;
            var found_1 = TreeDictionary.getPropertyByPath(this.tree, currentSearchPath);
            if (found_1) {
                return found_1;
            }
            currentBaseBranchPath = TreeDictionary.removeLastBranchSegmment(currentBaseBranchPath);
        }
        var found = TreeDictionary.getPropertyByPath(this.tree, branchPathToResolve);
        if (found) {
            return found;
        }
    };
    TreeDictionary.prototype.createIndexForTailBranchCombinations = function (branchesPath, obj) {
        var currentBranch = branchesPath;
        while (currentBranch) {
            this.tailBranchSegmentCombinations[currentBranch] = this.tailBranchSegmentCombinations[currentBranch] || [];
            this.tailBranchSegmentCombinations[currentBranch].push(obj);
            currentBranch = TreeDictionary.removeFirstBranchSegmment(currentBranch);
        }
    };
    TreeDictionary.prototype.addToTree = function (branchesPath, obj) {
        TreeDictionary.assignObjToBranchesPath(this.tree, branchesPath, obj);
    };
    TreeDictionary.getOrCreateObjAtKey = function (parentObj, key) {
        var obj = (parentObj[key] = parentObj[key] || {});
        return obj;
    };
    TreeDictionary.prototype.add = function (branchesPath, obj) {
        this.createIndexForTailBranchCombinations(branchesPath, obj);
        this.addToTree(branchesPath, obj);
    };
    TreeDictionary.prototype.clear = function () {
        this.tree = {};
        this.tailBranchSegmentCombinations = {};
    };
    TreeDictionary.errorReason = TreeDictionaryErrorReason;
    return TreeDictionary;
}());
window.simpleDefine = window.simpleDefine || (function (window) {
    var namespaceResolver = new TreeDictionary();
    function verifyArguments(argsArray) {
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
    function resolveNamedDependencies(dependingModuleNamespace, depenenciesArr) {
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
                }
                catch (er) {
                    if (er.reason === TreeDictionary.errorReason.NoCandidate) {
                        er.isResolutionTempError = true;
                    }
                    throw er;
                }
            }
            if (!depenenciesArr[count1]) {
                var error = new Error("Could not resolve '" + depToResolve + "' for '" + dependingModuleNamespace + "'");
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
    }
    ;
    function throwIfAnyDependencyUresolved(dependecyArr) {
        for (var count1 = 0; count1 < dependecyArr.length; count1++) {
            if (!dependecyArr[count1]) {
                throw new Error("Dependency is undefined");
            }
        }
    }
    var modulesWithUnresolvedDependencies = [];
    function ensureStoredForLaterResoultuion(moduleNamespace, moduleDependencies, moduleBody, failedDependency) {
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
            moduleNamespace: moduleNamespace,
            moduleBody: moduleBody,
            moduleDependencies: moduleDependencies,
            lastUnresolvedDependency: failedDependency
        });
    }
    function removeModuleStoredForLaterResolution(module) {
        for (var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++) {
            if (module === modulesWithUnresolvedDependencies[count1]) {
                modulesWithUnresolvedDependencies.splice(count1, 1);
                return;
            }
        }
    }
    var finalResolveAttemptTimeoutId;
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
        var result = [];
        for (var count1 = 0; count1 < modulesWithUnresolvedDependencies.length; count1++) {
            var module = modulesWithUnresolvedDependencies[count1];
            var failureDesc = {
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
            throw new Error("Async resolution timeout passed, still some modules unresolved; \r\n" +
                JSON.stringify(uresolved));
        }
        finalReolveAttempt();
    }
    function tryResolveUnresolvedModules() {
        var anySuccess = false;
        var modulesToResolve = modulesWithUnresolvedDependencies.slice();
        for (var count1 = 0; count1 < modulesToResolve.length; count1++) {
            var module = modulesToResolve[count1];
            try {
                exports(module.moduleNamespace, module.moduleDependencies, module.moduleBody, true);
                anySuccess = true;
                removeModuleStoredForLaterResolution(module);
            }
            catch (err) {
                if (!err.isResolutionTempError) {
                    removeModuleStoredForLaterResolution(module);
                    throw err;
                }
            }
        }
        return anySuccess;
    }
    function resolveDependenciesOrStoreForLater(moduleNamespace, moduleDependencies, moduleBody, allowThrow) {
        if (allowThrow === void 0) { allowThrow = false; }
        var resolveDependencies;
        try {
            if (isAnyResolutionOfNamedDependenciesAllowed()) {
                resolveDependencies = resolveNamedDependencies(moduleNamespace, moduleDependencies);
            }
            else {
                resolveDependencies = moduleDependencies;
            }
            throwIfAnyDependencyUresolved(resolveDependencies);
        }
        catch (err) {
            if (allowThrow
                || exports.asyncResolutionTimeout == 0
                || !err.isResolutionTempError) {
                throw err;
            }
            ensureStoredForLaterResoultuion(moduleNamespace, moduleDependencies, moduleBody, err.failedDependency);
            debounceFinalResolveAttempt();
            return;
        }
        return resolveDependencies;
    }
    function storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, moduleOutput) {
        namespaceResolver.add(moduleNamespace, moduleOutput);
        if (exports.exposeModulesAsNamespaces) {
            TreeDictionary.assignObjToBranchesPath(window, moduleNamespace, moduleOutput);
        }
        window.setTimeout(tryResolveUnresolvedModules);
    }
    var exports = function (moduleNamespace, moduleDependencies, moduleBody, allowThrow) {
        if (allowThrow === void 0) { allowThrow = false; }
        var moduleArgs = Array.prototype.slice.call(arguments, 0, 3);
        verifyArguments(moduleArgs);
        var resolvedDependencies = resolveDependenciesOrStoreForLater(moduleNamespace, moduleDependencies, moduleBody, allowThrow);
        if (!resolvedDependencies) {
            return;
        }
        var moduleOutput = moduleBody.apply(void 0, resolvedDependencies);
        if (!moduleNamespace) {
            return;
        }
        if (exports.resolveModulesReturningPromises
            && moduleOutput
            && moduleOutput.then) {
            moduleOutput.then(function (resolvedBody) { return storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, resolvedBody); })
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
    };
    exports.clearUnresolved = function () {
        clearDebouncedResolve();
        modulesWithUnresolvedDependencies = [];
    };
    return exports;
})(window);
window.loadOnce = window.loadOnce || (function (window) {
    function isStringOrNothing(x) {
        return typeof x == 'string' || typeof x == 'undefined' || x === null;
    }
    function isArray(subject, perItemCheck) {
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
    function replacePlaceholderAtTheBeginingWithAppSubPath(path) {
        if (exports.subPathPlaceholder
            && exports.appSubPath
            && path.lastIndexOf(exports.subPathPlaceholder, 0) === 0) {
            path = path.replace(exports.subPathPlaceholder, exports.appSubPath);
        }
        return path;
    }
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    ;
    function findRecordMatchingEndingInDict(dict, path) {
        for (var key in dict) {
            if (dict.hasOwnProperty(key) == false) {
                continue;
            }
            if (endsWith(path.toUpperCase(), key.toUpperCase())) {
                return dict[key];
            }
        }
    }
    function loadFileOnce(basePath, filePath) {
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
    function loadScriptOnce(path, scriptType) {
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
    function loadLinkOnce(path, linkRel) {
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
    var exports = function loadOnce(basePathOrFilesList, filesList) {
        if (isArray(basePathOrFilesList, isStringOrNothing)) {
            return loadOnce("", basePathOrFilesList);
        }
        else if (typeof basePathOrFilesList != 'string' || isArray(filesList, isStringOrNothing) == false) {
            throw new Error("loadOnce has invalid arguments. Must have either (filesList:string[]) or (basePath:string, filesList:string[])");
        }
        var basePath = basePathOrFilesList;
        for (var count1 = 0; count1 < filesList.length; count1++) {
            loadFileOnce(basePath, filesList[count1]);
        }
    };
    exports.subPathPlaceholder = "~";
    exports.acceptableFileTypesForLink = {
        ".css": "stylesheet"
    };
    exports.acceptableFileTypesForScript = {
        ".js": "text/javascript"
    };
    return exports;
})(window);
//# sourceMappingURL=amd-like-modules.js.map