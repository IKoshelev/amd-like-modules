window.simpleDefine = (function (window) {
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
    function resolveDependencyByName(name) {
        var candidates = moduleNamesResolutionDictionary[name];
        if (!candidates) {
            throw new Error("Could not resolve '" + name + "', no modules end in this combination of namepsaces.");
        }
        if (candidates.length > 1) {
            throw new Error("Could not resolve '" + name + "', multiple modules end in this combination of namepsaces.");
        }
        return candidates[0];
    }
    function resolveNamedDependenciesIfAllowed(depenenciesArr) {
        if (window.simpleDefine.isAllowedNamedDependencies == false) {
            return depenenciesArr;
        }
        return resolveNamedDependencies(depenenciesArr);
    }
    function resolveNamedDependencies(depenenciesArr) {
        for (var count1 = 0; count1 < depenenciesArr.length; count1++) {
            if (typeof depenenciesArr[count1] === "string") {
                depenenciesArr[count1] = resolveDependencyByName(depenenciesArr[count1]);
            }
        }
        return depenenciesArr;
    }
    function getOrCreateNamespace(parentNamespace, namespaceName) {
        var namespace = (parentNamespace[namespaceName] = parentNamespace[namespaceName] || {});
        return namespace;
    }
    var moduleNamesResolutionDictionary = {};
    function storeDependencyForStringNameResolution(moduleNamespace, moduleOutput) {
        var currentName = moduleNamespace;
        while (currentName) {
            moduleNamesResolutionDictionary[currentName] = moduleNamesResolutionDictionary[currentName] || [];
            moduleNamesResolutionDictionary[currentName].push(moduleOutput);
            currentName = removeFirstSegmment(currentName);
        }
    }
    function removeFirstSegmment(namespaces) {
        var dotIndex = namespaces.indexOf(".");
        if (dotIndex === -1) {
            return "";
        }
        return namespaces.substr(dotIndex + 1);
    }
    function assignOutputToNamespaceOnWindow(moduleNamespace, moduleOutput) {
        var namespaceSegments = moduleNamespace.split(".");
        if (namespaceSegments.length === 1) {
            window[namespaceSegments[0]] = moduleOutput;
        }
        var currentNamepaceObj = getOrCreateNamespace(window, namespaceSegments[0]);
        for (var count1 = 1; count1 < namespaceSegments.length - 1; count1++) {
            currentNamepaceObj = getOrCreateNamespace(currentNamepaceObj, namespaceSegments[count1]);
        }
        var finalNamespace = namespaceSegments[namespaceSegments.length - 1];
        currentNamepaceObj[finalNamespace] = moduleOutput;
    }
    var exports = function (moduleNamespace, moduleDependencies, moduleBody) {
        verifyArguments(arguments);
        var resolveDependencies = resolveNamedDependenciesIfAllowed(moduleDependencies);
        var moduleOutput = moduleBody.apply(void 0, resolveDependencies);
        storeDependencyForStringNameResolution(moduleNamespace, moduleOutput);
        assignOutputToNamespaceOnWindow(moduleNamespace, moduleOutput);
    };
    exports.isAllowedNamedDependencies = false;
    exports.clearNamesResolutionDictionary = function () {
        moduleNamesResolutionDictionary = {};
    };
    return exports;
})(window);
//# sourceMappingURL=amd-simple-modules.js.map