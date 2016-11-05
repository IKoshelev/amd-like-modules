/// <reference path="../typings/index.d.ts" />
describe("amd-like-modules.simpleDefine", () => {

	var initialLoadOnce = window.loadOnce;
	var namespace1 = "ns_1_";
	var namespace2 = "ns_2_";
	var namespace3 = "ns_3_";
	var namespace4 = "ns_4_";
	var namespaceIgnore = "ignore";
	var marker1 = {};
	var marker2 = {};
	var marker3 = {};
	var marker4 = {};
	var marker5 = {};
	var param1: any;
	var param2: any;
	var param3: any;
	var param4: any;
	var filepath1 = "FILEPATH1";
	var filepath2 = "FILEPATH2";

	afterEach(() => {
		window.simpleDefine.clearModuleFileInfoMap();
		window.simpleDefine.clearUnresolved();
		window.simpleDefine.exposeModulesAsNamespaces = true;
		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = false;
		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = false;
		window.simpleDefine.asyncResolutionTimeout = 0;
		window.simpleDefine.clearInternalNamespaceStructure();
		window.loadOnce = initialLoadOnce;

		[namespace1, namespace2, namespace3, namespace4, namespaceIgnore].forEach((ns) => {
			if (!(<any>window)[ns]) {
				return;
			}
			try {
				delete (<any>window)[ns];
			}
			catch (e) {
				(<any>window)[ns] = undefined;
			}
		});

		marker1 = {};
		marker2 = {};
		marker3 = {};
		marker4 = {};
		marker5 = {};

		param1 = param2 = param3 = param4 = undefined;
	});

	it("should provide simpleDefine function on window object", () => {
		expect(window.simpleDefine).toBeDefined();
		expect(typeof window.simpleDefine).toBe("function");

	});

	it("should throw unless 3 arguments (string,[],function)", () => {
		expect(() => (<any>window.simpleDefine)("", [], () => { })).not.toThrow();
		expect(() => (<any>window.simpleDefine)("", {}, () => { })).toThrow();
		expect(() => (<any>window.simpleDefine)({}, [], () => { })).toThrow();
		expect(() => (<any>window.simpleDefine)("", [], {})).toThrow();
		expect(() => (<any>window.simpleDefine)()).toThrow();

	});

	it("executes module body, passing in dependencies", () => {

		window.simpleDefine(namespaceIgnore,
			[marker1, {}, marker2, marker3],
			function (_dep1, ignore, _dep2) {
				param1 = _dep1;
				param2 = _dep2;
				param3 = arguments[3];
			});

		expect(marker1 === param1).toBe(true);
		expect(marker2 === param2).toBe(true);
		expect(marker3 === param3).toBe(true);

	});

	it("by default exposes module output on window object via namespaces," +
		" preserving preexisting namesapces", () => {

			window.simpleDefine(namespace1, [], () => marker1);

			expect((<any>window)[namespace1] === marker1).toBe(true);

			var combinedNamespace = `${namespace1}.${namespace2}.${namespace3}`;

			window.simpleDefine(combinedNamespace, [], () => marker2);

			expect((<any>window)[namespace1] === marker1).toBe(true);
			expect((<any>window)[namespace1][namespace2][namespace3] === marker2).toBe(true);

		});

	it("can turn off exposing modules as namespaces", () => {
		window.simpleDefine.exposeModulesAsNamespaces = false;

		window.simpleDefine(namespace1, [], () => marker1);

		expect((<any>window)[namespace1]).not.toBeDefined();
	});

	it("ignores named dependencies by default", () => {

		expect(window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination).toBe(false);

		window.simpleDefine(namespaceIgnore, [namespace1], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === namespace1).toBe(true);

	});

	[{ it: "resolves named dependencies if flag is set", val: true },
	{ it: "resolves named dependencies if flag is set, even when namespace are not exposed on window", val: false }]
		.forEach((testCase) => {
			it(testCase.it, () => {
				window.simpleDefine.exposeModulesAsNamespaces = testCase.val;
				window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;

				// 1 namespace in chain - simple case
				window.simpleDefine(namespace1, [], () => marker1);
				window.simpleDefine(namespaceIgnore, [namespace1], (_dep1) => {
					param1 = _dep1;
					return {};
				});

				expect(marker1 === param1).toBe(true);

				// multiple segments in chain
				var lastNamespace = "bax";
				var beforelastNamespace = "services";
				var fullNamespace = `${namespace2}.${beforelastNamespace}.${lastNamespace}`;
				window.simpleDefine(fullNamespace, [], () => marker2);

				window.simpleDefine(namespaceIgnore, [lastNamespace], (_dep2) => {
					param2 = _dep2;
				});
				expect(marker2 === param2).toBe(true);

				window.simpleDefine(namespaceIgnore, [fullNamespace], (_dep3) => {
					param3 = _dep3;
				});
				expect(marker2 === param3).toBe(true);
			});
		});

	it("clears existing namespace dict on clearNamesResolutionDictionary()", () => {
		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;

		window.simpleDefine(namespace1, [], () => marker1);

		expect(() => window.simpleDefine(namespaceIgnore, [namespace1], () => { })).not.toThrow();

		window.simpleDefine.clearInternalNamespaceStructure();

		expect(() => window.simpleDefine(namespaceIgnore, [namespace1], () => { })).toThrow();
	});

	it("during named dependencies resolution " +
		"throws if not found or ambiguous", () => {

			window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
			expect(() => window.simpleDefine(namespaceIgnore, ["nonexistingDependency"], () => { })).toThrow();

			var commonName = "user";
			var firstCandidateNs = `${namespace1}.controllers.${commonName}`;
			var secondCandidateNs = `${namespace2}.services.${commonName}`;

			window.simpleDefine(firstCandidateNs, [], () => { });
			window.simpleDefine(secondCandidateNs, [], () => { });

			expect(() => window.simpleDefine(namespaceIgnore, [commonName], () => { })).toThrow();
		});

	it("by default does not resolve dependencies in same namespace branch", () => {

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;

		window.simpleDefine(namespaceInBranch1, [], () => {
			return marker1;
		});

		window.simpleDefine(namespaceInBranch2, [namespace3], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === namespace3).toBe(true);
	});

	it("resolves dependencies in same namespace branch with flag set", () => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;

		window.simpleDefine(namespaceInBranch1, [], () => {
			return marker1;
		});

		window.simpleDefine(namespaceInBranch2, [namespace2], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === marker1).toBe(true);
	});

	it("resolves dependencies in same namespace branch including nested", () => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;

		var namespaceInBranch1 = `${namespace1}.${namespace2}.${namespace4}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;

		window.simpleDefine(namespaceInBranch1, [], () => {
			return marker1;
		});

		window.simpleDefine(namespaceInBranch2, [`${namespace2}.${namespace4}`], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === marker1).toBe(true);
	});

	it("will look on window as part of same branch resolution strategy", () => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;
		var namespaceInBranch2 = `${namespace3}.${namespace4}`;

		window.simpleDefine(namespaceInBranch1, [], () => {
			return marker1;
		});

		window.simpleDefine(namespaceInBranch2, [namespaceInBranch1], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === marker1).toBe(true);
	});

	it("correectly resolves dependencies in upper namespace branch with flag set", () => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;

		var namespaceInBranch1 = `${namespace3}.${namespace1}.${namespace2}.${namespace3}`;
		var namespaceInBranch2 = `${namespace3}.${namespace1}.${namespaceIgnore}`;

		window.simpleDefine(namespaceInBranch1, [], () => {
			return marker1;
		});

		window.simpleDefine(namespaceInBranch2, [`${namespace2}.${namespace3}`], (_dep1) => {
			param1 = _dep1;
		});

		expect(param1 === marker1).toBe(true);

		var namespaceNotInBranch = `${namespace1}.${namespaceIgnore}`;
		expect(() => window.simpleDefine(namespaceNotInBranch, [`${namespace2}.${namespace3}`], () => { })).toThrow();
	});

	it("allows async loading with named dependencies", (done) => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.asyncResolutionTimeout = 50;

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;

		var hasExecutedModule1 = false;
		var hasExecutedModule2 = false;

		var module2ExectuionsCount = 0;
		window.simpleDefine(namespaceInBranch2, [namespace2], (_dep1) => {
			hasExecutedModule2 = true;
			module2ExectuionsCount++;
			param1 = _dep1;
		})

		expect(hasExecutedModule2).toBe(false);

		window.simpleDefine(namespaceInBranch1, [], () => {
			hasExecutedModule1 = true;
			return marker1;
		});

		expect(hasExecutedModule2).toBe(false);
		expect(hasExecutedModule1).toBe(true);

		// execution happens asap async
		window.setTimeout(() => {
			expect(hasExecutedModule2).toBe(true);
			expect(param1 === marker1).toBe(true);
		});

		window.setTimeout(() => {
			expect(module2ExectuionsCount == 1).toBe(true);
			done();
		}, 100);
	});

	it("throws exception if any module is left unloaded after timeout", (done) => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.asyncResolutionTimeout = 50;

		var namespaceInBranch = `${namespace1}.${namespace3}`;
		var hasExecutedModule = false;

		window.simpleDefine(namespaceInBranch, [namespace2], (_dep1) => {
			hasExecutedModule = true;
			param1 = _dep1;
		});

		expect(hasExecutedModule).toBe(false);

		var oldOnError = window.onerror;
		var thrownMessage: string;
		window.onerror = function (msg) {
			thrownMessage = msg;
		}

		window.setTimeout(() => {
			window.onerror = oldOnError;
			expect(thrownMessage).toBeDefined();
			expect(thrownMessage.indexOf("unresolved") > -1).toBe(true);
			done();
		}, 100);

	});

	it("unique last namesapce combination ambiguity throws exception immediately even with async resolution", (done) => {

		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
		window.simpleDefine.asyncResolutionTimeout = 50;

		var namespaceEndingAmbiguosly1 = `${namespace1}.${namespace3}`;
		var namespaceEndingAmbiguosly2 = `${namespace2}.${namespace3}`;

		var hasExecutedModule = false;
		window.simpleDefine(namespaceIgnore, [namespace3], () => {
			hasExecutedModule = true;
		});
		expect(hasExecutedModule).toBe(false);

		var oldOnError = window.onerror;
		var thrownMessage: string;
		window.onerror = function (msg) {
			thrownMessage = msg;
		}

		window.simpleDefine(namespaceEndingAmbiguosly1, [], () => marker1);
		window.simpleDefine(namespaceEndingAmbiguosly2, [], () => marker2);

		expect(hasExecutedModule).toBe(false);

		window.setTimeout(() => {
			window.onerror = oldOnError;
			expect(hasExecutedModule).toBe(false);
			expect(thrownMessage).toBeDefined();
			expect(thrownMessage.indexOf("multiple candidates.") > -1).toBe(true);
		}, 50);

		window.setTimeout(done, 100);
	});

	it("exception inside module body is reported during sync execution", () => {

		try {
			window.simpleDefine(namespaceIgnore, [], () => {
				throw new Error("MARKER_FJE");
			});
			return;
		} catch (err) {
			expect(err.message.indexOf("MARKER_FJE") > -1).toBe(true);
		}
	});

	it("exception inside module body is reported during async execution", (done) => {

		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
		window.simpleDefine.asyncResolutionTimeout = 50;

		var namespaceEndingAmbiguosly1 = `${namespace1}.${namespace3}`;

		var hasExecutionOfModuleStarted = false;
		window.simpleDefine(namespaceIgnore, [namespace3], () => {
			hasExecutionOfModuleStarted = true;
			throw new Error("MARKER_YDP");
		});
		expect(hasExecutionOfModuleStarted).toBe(false);

		var oldOnError = window.onerror;
		var thrownMessage: string;
		window.onerror = function (msg) {
			thrownMessage = msg;
		}

		window.simpleDefine(namespaceEndingAmbiguosly1, [], () => marker1);

		expect(hasExecutionOfModuleStarted).toBe(false);

		window.setTimeout(() => {
			window.onerror = oldOnError;
			expect(hasExecutionOfModuleStarted).toBe(true);
			expect(thrownMessage).toBeDefined();
			expect(thrownMessage.indexOf("MARKER_YDP") > -1).toBe(true);
		}, 50);

		window.setTimeout(done, 100);
	});

	it("resolving modules trigger resolution of modules dependant on them", (done) => {

		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.asyncResolutionTimeout = 50;

		var namespaceInBranch1 = `${namespace1}.${namespace4}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;
		var namespaceInBranch3 = `${namespace1}.${namespace2}`;

		var module1hasExecuted = false;
		var module2hasExecuted = false;
		var module3hasExecuted = false;

		window.simpleDefine(namespaceInBranch1, [namespace3], (_dep1) => {
			module1hasExecuted = true;
			param1 = _dep1;
		});

		window.simpleDefine(namespaceInBranch2, [namespace2], (_dep1) => {
			module2hasExecuted = true;
			param2 = _dep1;
			return marker2;
		});

		window.simpleDefine(namespaceInBranch3, [], () => {
			module3hasExecuted = true;
			return marker3;
		});

		expect(module1hasExecuted).toBe(false);
		expect(module2hasExecuted).toBe(false);
		expect(module3hasExecuted).toBe(true);

		window.setTimeout(() => {
			expect(module1hasExecuted).toBe(true);
			expect(module2hasExecuted).toBe(true);
			expect(module3hasExecuted).toBe(true);
			expect(param2 === marker3).toBe(true);
			expect(param1 === marker2).toBe(true);
		}, 30);

		window.setTimeout(done, 100);

	});

	it("promises returned from modules resolution can be turned off", () => {

		window.simpleDefine.resolveModulesReturningPromises = false;
		window.simpleDefine.asyncResolutionTimeout = 50;
		window.simpleDefine.exposeModulesAsNamespaces = true;

		var pseudoPromise = { then: (): void => { return undefined; } }

		window.simpleDefine(namespace1, [], () => {
			return pseudoPromise;
		});

		expect((<any>window)[namespace1]).toBe(pseudoPromise);
	});

	it("promises returned from modules are resolved if flag set", () => {

		window.simpleDefine.asyncResolutionTimeout = 50;
		window.simpleDefine.exposeModulesAsNamespaces = true;
		window.simpleDefine.resolveModulesReturningPromises = true;

		var doneWasCalled = false;

		var pseudoPromise = {
			then: (fn: (resolvedBody: any) => any): any => {
				fn(marker1);
				return {
					done: () => { doneWasCalled = true; }
				};
			}
		};

		window.simpleDefine(namespace1, [], () => {
			return pseudoPromise;
		});

		expect((<any>window)[namespace1]).toBe(marker1);
		expect(doneWasCalled).toBe(true);
	});

	it("promises returned from modules trigger dependencies when resolved", (done) => {
		window.simpleDefine.asyncResolutionTimeout = 1000;
		window.simpleDefine.exposeModulesAsNamespaces = true;
		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
		window.simpleDefine.resolveModulesReturningPromises = true;

		var module1hasExecuted = false;
		var module2hasExecuted = false;
		var module1WarResolvedAndPassedAsDependency = false;
		var doneWasCalled = false;

		var pseudoPromise = {
			then: (fn: (resolvedBody: any) => any): any => {
				window.setTimeout(() => { fn(marker1); }, 25);
				return {
					done: () => { doneWasCalled = true; }
				};
			}
		};

		window.simpleDefine(namespace1, [], () => {
			module1hasExecuted = true;
			return pseudoPromise;
		});
		expect(module1hasExecuted).toBe(true);
		expect((<any>window)[namespace1]).toBeUndefined();

		window.simpleDefine(namespace2, [namespace1], (param1) => {
			module2hasExecuted = true;
			module1WarResolvedAndPassedAsDependency = (param1 === marker1);
		});

		expect(module2hasExecuted).toBe(false);

		window.setTimeout(() => {
			expect(module1hasExecuted).toBe(true);
			expect(module2hasExecuted).toBe(true);
			expect(doneWasCalled).toBe(true);
			expect(module1WarResolvedAndPassedAsDependency).toBe(true);
			done();
		}, 200);
	});

	it("feature combination test", (done) => {

		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.resolveModulesReturningPromises = true;
		window.simpleDefine.asyncResolutionTimeout = 1000;

		var dependingModule = `${namespace1}.${namespace2}`;
		var dependencyBranch = `${namespace1}.${namespace3}.${namespace4}`;
		var dependencyUniqueTail = `${namespace2}.${namespace3}.${namespace1}`;
		var dependencyReturningPromise = `${namespace1}.${namespace3}.${namespace2}`;
		var hasExecuted = false;

		var pseudoPromise = {
			then: (fn: (resolvedBody: any) => any): any => {
				window.setTimeout(() => fn(marker4), 25);
				return { done: () => { } }
			}
		};

		window.simpleDefine(dependingModule,

			[`${namespace3}.${namespace4}`,
			`${namespace3}.${namespace1}`,
				marker3,
				dependencyReturningPromise],

			(depBranch, depUniqueTail, depDirect, depPromise) => {
				param1 = depBranch;
				param2 = depUniqueTail;
				param3 = depDirect;
				param4 = depPromise;
				hasExecuted = true;
				return marker5;
			});

		expect(hasExecuted).toBe(false);

		window.simpleDefine(dependencyBranch, [], () => marker1);

		expect(hasExecuted).toBe(false);

		window.simpleDefine(dependencyUniqueTail, [], () => marker2);

		expect(hasExecuted).toBe(false);

		window.simpleDefine(dependencyReturningPromise, [], () => pseudoPromise);

		expect(hasExecuted).toBe(false);

		window.setTimeout(() => {
			expect(hasExecuted).toBe(true);
			expect(param1).toBe(marker1);
			expect(param2).toBe(marker2);
			expect(param3).toBe(marker3);
			expect(param4).toBe(marker4);
			expect((<any>window)[namespace1][namespace2] === marker5).toBe(true);
		}, 500);

		window.setTimeout(done, 1000);

	});

	it("calls 'loadOnce' to load files containing modules if async loading enabled and useModuleFileInfoMap was called to provide a map", () => {
		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
		window.simpleDefine.asyncResolutionTimeout = 1000;

		var loadded: Array<Array<string>> = [];
		var loadOnceCallCount = 0;
		window.loadOnce = (((pathArr: string[]) => {
			loadded.push(pathArr);
			loadOnceCallCount += 1;
		}) as any);

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;
		var namespaceInBranch2 = `${namespace1}.${namespace3}`;
		var namespaceInBranch3 = `${namespace1}.${namespace4}`;

		window.simpleDefine.useModuleFileInfoMap([
			{
				moduleNamespace: namespaceInBranch2,
				filePath: filepath1
			},
			{
				moduleNamespace: namespaceInBranch3,
				filePath: filepath2
			}
		]);

		var module1HasExecuted = false;
		window.simpleDefine(namespaceInBranch1, [namespaceInBranch2, namespace4], () => {
			module1HasExecuted = true;
		});

		expect(loadded[0][0] === filepath1);
		expect(loadded[1][0] === filepath2);
		expect(module1HasExecuted === false);
		expect(loadOnceCallCount === 2);

		window.simpleDefine(namespaceInBranch2, [namespaceInBranch3], () => ({}));

		expect(module1HasExecuted === false);
		expect(loadOnceCallCount === 2);

		window.simpleDefine(namespaceInBranch3, [], () => ({}));

		expect(module1HasExecuted === true);
		expect(loadOnceCallCount === 2);

	});

	it("useModuleFileInfoMap will throw if same module namespace in different files", () => {

		var namespaceInBranch1 = `${namespace1}.${namespace2}`;

		try {
			window.simpleDefine.useModuleFileInfoMap([
				{
					moduleNamespace: namespaceInBranch1,
					filePath: filepath1
				},
				{
					moduleNamespace: namespaceInBranch1,
					filePath: filepath2
				}
			]);
			expect(false) // should not get here
		} catch (er) {
			expect((er as Error).message.indexOf(namespaceInBranch1) > -1);
			return;
		}

		expect(false) // should not get here

	});

});