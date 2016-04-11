window.simpleDefine = window.simpleDefine || (function (window) {
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
    function resolveDependencyByUniqueLastNamespaceCombination(moduleNs, depNs) {
        var candidates = moduleNsTailCombinationsDict[depNs];
        if (!candidates) {
            throw new Error("Could not resolve '" + depNs + "' for '" + moduleNs + "', no modules end in this combination of namepsaces.");
        }
        if (candidates.length > 1) {
            var error = new Error("Could not resolve '" + depNs + "' for '" + moduleNs + "', multiple modules end in this combination of namepsaces.");
            error.isResolutionPermanentError = true;
            throw error;
        }
        return candidates[0];
    }
    function resolveDependencyInSameNamespaceBranch(moduleNs, depNs) {
        if (!moduleNs) {
            return getPropertyByPath(internalNamespaceTreeHolder, depNs);
        }
        var currentNsBranch = removeLastNsSegmment(moduleNs);
        while (currentNsBranch) {
            var currentSearchPath = currentNsBranch + '.' + depNs;
            var resolvedDependency_1 = getPropertyByPath(internalNamespaceTreeHolder, currentSearchPath);
            if (resolvedDependency_1) {
                return resolvedDependency_1;
            }
            currentNsBranch = removeLastNsSegmment(currentNsBranch);
        }
        var resolvedDependency = getPropertyByPath(internalNamespaceTreeHolder, depNs);
        if (resolvedDependency) {
            return resolvedDependency;
        }
    }
    function getPropertyByPath(obj, path) {
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
    }
    function resolveNamedDependencies(dependingModuleNamespace, depenenciesArr) {
        depenenciesArr = depenenciesArr.slice();
        for (var count1 = 0; count1 < depenenciesArr.length; count1++) {
            if (typeof depenenciesArr[count1] !== "string") {
                continue;
            }
            var depToResolve = depenenciesArr[count1];
            if (exports.resolveNamedDependenciesInSameNamespaceBranch) {
                depenenciesArr[count1] = resolveDependencyInSameNamespaceBranch(dependingModuleNamespace, depToResolve);
                if (depenenciesArr[count1]) {
                    continue;
                }
            }
            if (exports.resolveNamedDependenciesByUniqueLastNamespaceCombination) {
                depenenciesArr[count1] = resolveDependencyByUniqueLastNamespaceCombination(dependingModuleNamespace, depToResolve);
            }
            if (!depenenciesArr[count1]) {
                var error = new Error("Could not resolve '" + depToResolve + "' for '" + dependingModuleNamespace + "'");
                error.failedDependency = depToResolve;
                throw error;
            }
        }
        return depenenciesArr;
    }
    function getOrCreateNamespace(parentNamespace, namespaceName) {
        var namespace = (parentNamespace[namespaceName] = parentNamespace[namespaceName] || {});
        return namespace;
    }
    var moduleNsTailCombinationsDict = {};
    function storeModuleNsTailCombinationsForQniqueTailNsResolution(moduleNamespace, moduleOutput) {
        var currentName = moduleNamespace;
        while (currentName) {
            moduleNsTailCombinationsDict[currentName] = moduleNsTailCombinationsDict[currentName] || [];
            moduleNsTailCombinationsDict[currentName].push(moduleOutput);
            currentName = removeFirstNsSegmment(currentName);
        }
    }
    function removeFirstNsSegmment(namespaces) {
        var dotIndex = namespaces.indexOf(".");
        if (dotIndex === -1) {
            return "";
        }
        return namespaces.substr(dotIndex + 1);
    }
    function removeLastNsSegmment(namespaces) {
        var dotIndex = namespaces.lastIndexOf(".");
        if (dotIndex === -1) {
            return "";
        }
        return namespaces.slice(0, dotIndex);
    }
    var internalNamespaceTreeHolder = {};
    function assignOutputToNamespace(holderObject, moduleNamespace, moduleOutput) {
        var namespaceSegments = moduleNamespace.split(".");
        if (namespaceSegments.length === 1) {
            holderObject[namespaceSegments[0]] = moduleOutput;
            return;
        }
        var currentNamepaceObj = getOrCreateNamespace(holderObject, namespaceSegments[0]);
        for (var count1 = 1; count1 < namespaceSegments.length - 1; count1++) {
            currentNamepaceObj = getOrCreateNamespace(currentNamepaceObj, namespaceSegments[count1]);
        }
        var finalNamespace = namespaceSegments[namespaceSegments.length - 1];
        currentNamepaceObj[finalNamespace] = moduleOutput;
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
            lastUnresolvedDependency: failedDependency });
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
                if (err.isResolutionPermanentError) {
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
                || err.isResolutionPermanentError) {
                throw err;
            }
            ensureStoredForLaterResoultuion(moduleNamespace, moduleDependencies, moduleBody, err.failedDependency);
            debounceFinalResolveAttempt();
            return;
        }
        return resolveDependencies;
    }
    function storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, moduleOutput) {
        storeModuleNsTailCombinationsForQniqueTailNsResolution(moduleNamespace, moduleOutput);
        assignOutputToNamespace(internalNamespaceTreeHolder, moduleNamespace, moduleOutput);
        if (exports.exposeModulesAsNamespaces) {
            assignOutputToNamespace(window, moduleNamespace, moduleOutput);
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
            moduleOutput.then(function (resolvedBody) { return storeBodyAndTryExecutingDependentsForNamedModule(moduleNamespace, resolvedBody); });
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
        moduleNsTailCombinationsDict = {};
        internalNamespaceTreeHolder = {};
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
            if (scriptTags[count1].src === newTag.src) {
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
            if (linkTags[count1].href === newTag.href) {
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