# amd-like-modules

## What this is
AMD like modules for existing JS projects that allow gradual convertion to modularised code rather than requiring convertion of entire old codebase. 

## What this does
It will allow you to asynchronously load modules with advanced namespace resolution, old code interop, promise handling and file auto-loading.

```javascript
        window.simpleDefine(
			"myApp.ui.viewmodels.userDetailsVm", 
			[$, _, Q,							// pass objects directly
			"services.userDetails",  			// resolved asynchronously to "myApp.services.userDetails"
			"gridHelpers"],						// reolved asynchronously to "myApp.ui.gridHelpers"
			
        function ($, _, Q, userDetailsSrv, gridHelpers) {
          
		  //module body, will execute once all named dependencies have been loaded.
          function UserDetailsVm(details,activity){
            //...
          };
          
          return Q.all([
                	userDetailsSrv.getDetails(), 
                	userDetailsSrv.getActivity()])
              .spread(function (details, activity) {
                  	return new UserDetailsVm(details,activity);
              });

			  // the resulting UserDetailsVm instance will become module export
          
        });

		window.simpleDefine(
			"myApp.ui.viewmodels.userAcountManagmentVm",
			[$, _, Q,
			"userDetailsVm",
			"userStatisticsVm"],			// we have this module loaded elsewhere

			function(userDetailsVm, userStatisticsVm){

				var exports = {};

				exports.userDetailsVm = userDetailsVm;
				exports.userStatisticsVm = userStatisticsVm;

				//... some more init code;

				return exports;
		});
```

 From old code you can still access new modules like this (once module body has been executed ofcourse):

```javascript      
        var userDetailsVmFactory = window.myApp.ui.viewmodels.userDetailsVm;
		var userAcountManagmentVm = window.myApp.ui.viewmodels.userAcountManagmentVm;		
```

This lib also facilitates loading of files contatining modules once you provide a map of moduleNamespace => filePath correspsondence

```javascript
		window.simpleDefine.useModuleFileInfoMap([
			{
				moduleNamespace: "myApp.services.userDetails",
				filePath: "~services/userDetails.js"
			},
			{
				moduleNamespace: "myApp.ui.gridHelpers",
				filePath: "~ui/heleplers/gridHelpres.js"
			}
			//... more mappings. We autogenerate this map during build by scanning all js files with a regex porvided below.
		]);

```

or just loading them from JS with protection from loading the same file twice

```javascript
window.loadOnce("~ui/viewmodels/",["marketPricesView.css","marketPricesVm.js"]);
```

This project arose as i was working for a babnking enterprise where we had a large existing JavaScript codebase using either no modules at all or namespace objects on window and we needed to start using a better module system, while maintaining interop between old and new code. First consideration was RequireJS using AMD modules, but the team strugled with it due to naming issues and several libraries changing their behaviour when they detected availability of RequireJS, thus breaking old code. Mixing old and new code was also a problem. We decided to write a small library that would give us just the AMD functionality we needed and would not change anything in the existing code. 

After using this library for year, we have successfully modularised and refactored our existing code and even started several new projects using it.  

## configuration

Most advanced options can be switched off \ tweaked from their defaults (which follow)

```javascript
	window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;
	window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
	window.simpleDefine.resolveModulesReturningPromises = true;
	window.simpleDefine.exposeModulesAsNamespaces = true;
	window.simpleDefine.asyncResolutionTimeout 5000;

```

## advanced reoultion features

It will search for corresponding namespace chain in each branch where depending module is descendant:

```javascript
window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;

window.simpleDefine("myApp.admin.services.warehouse", [], function () { ... });

        window.simpleDefine("myApp.admin.controllers.warehouse", 
              ["services.warehouse"],
              // resolution will look at the following namespaces:
              // "myApp.admin.controllers." + "services.warehouse" - nope
              // "myApp.admin." + "services.warehouse"             - dep. found
              // "myApp." + "services.warehouse"                   - would look here, if still didn't find
              // "" + "services.warehouse"                         - finally would check root for this namespace
              function (warehouseSrv) {
                
            });

// this "services.warehouse" will not interfere, because it is in a diferent namesapce branch 'user'
window.simpleDefine("myApp.user.services.warehouse", [], function () { ... }); 
```

It will resolve modules by last namespace or two, to make code shorter for uniquer namespace combinations:

```javascript
window.simpleDefine.resolveNamedDependenciesByUniqueLastNamespaceCombination = true;

window.simpleDefine("myApp.common.utils.calendar", [], function () { ... });
  
        window.simpleDefine("myApp.admin.controllers.warehouse", 
              ["utils.calendar"],
              //So long as only one module namespace chain ends in "utils.calendar", dependency will be resolved.
              //If there is ambiguity - an Error will be thrown
              function (calendarUtils) {
                ...
            });
```

As long as at least one of the above features is enbabled, it is possible to resolve some of the dependencies asynchronously. Each successfuly executed module will trigger a recheck for all modules that still have unresolved dependencies.

```javascript
		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.asyncResolutionTimeout = 5000; // 5 sec, having this > 0 activates async recheck 
		
		//does not execute immediately, but doesnt throw either
		window.simpleDefine("myApp.admin.scheduleCtrl",
		                ["scheduleSrv"],
		                function(scheduleSrv){
	                // module body
		});
		
		//once this module loads successfully, dependencies of 
		//"myApp.admin.scheduleCtrl" will be rechecked asynchronously (in the nearest available event loop iteration)
		//and it will also load
		window.simpleDefine("myApp.admin.scheduleSrv",
		        [],
		        function(){
                        // module body
		});
```
asyncResolutionTimeout also serves to prevent modules being stuck in limbo - if no new modules have been successfully loaded (i.e. with all their dependencies resolved and body executed) for that given duration, and modules with unresolved dependencies still exist - a notification error will be thrown (this is purely informative though, it does not halt module loading, in case missing modules do load later).

Another feature that works both with async resolution and on its own are modules returning promises. Whenever a corresponding flag is set and module function returns an object with a "then" key - this object will be treated as a promise and its "then" prop will be invoked to obtain the actual module body, followed by ```.done();```

```javascript
		window.simpleDefine.resolveNamedDependenciesInSameNamespaceBranch = true;
		window.simpleDefine.resolveModulesReturningPromises = true;
		window.simpleDefine.asyncResolutionTimeout = 5000; // 5 sec, having this > 0 activates async recheck 
		
		//does not execute immediately, but doesnt throw either
		window.simpleDefine("myApp.admin.scheduleTabVm",
		                ["scheduleSrv", "ScheduleCtrl"],
		                function(scheduleSrv, ScheduleCtrl){
	                return scheduleSrv
	                		.getSchedules()
	                		.then(function(schedules){
	                			return new ScheduleCtrl(schedules);
	                		});
		});
```
In this case, scheduleTabVm will be set to ```new ScheduleCtrl(schedules);``` once the promise is resolved. 

## Dependency loading features

To facilitate dependency loading for modules, a 'loadOnce' method is introduced, which saves you the trouble of keeping tabs on which modules were already loaded, and which not.

```javascript
	// configuration section, should be done once
	window.loadOnce.subPathPlaceholder = "~"; // default
	window.loadOnce.appSubPath = "/someapp/v2/"; // path to your app root from domain name. i.e.string in this example is for when you app main page is at www.ourbank.com/someapp/v2/index.html, and scripts are are loaded from  www.ourbank.com/someapp/v2/scripts/main.js
	
	// actual use
	window.loadOnce("~scripts/",["index.js","constants.js"]);	//load several files from same path
	window.loadOnce(["~css/site.css"])				//load several files withouth same path
```
as a result of above code, loadOnce will check all present script and link tags to see if any of them have the same resulting path, and if not, will add a new tag for the loaded file to 'head' element. 

You can also teach it new 'file' types. For example, our C# controllers generate their own JS clients with the help of reflection, but their paths don't end in '.js'. We accomodate them like this:

```javascript
	// "service" is the ending of the path; "text/javascript" is the 'type' attribute that will be used when generating 'script' tags for such paths
 	window.loadOnce.acceptableFileTypesForScript["service"] = "text/javascript";
       	window.loadOnce(["~api/MarketPrices/service"]);
```
Together with async dependency resolution features described above, this allows us to load dependencies at the top of our module files without woriyng that something may be loaded twice when two modules rely on it.

```javascript
window.loadOnce(["~api/MarketPrices/service"]);
window.simpeDefine("app.component.marketPrices",["api.marketPrices"],function(marketPricesService){...})
```
and even in views:
```html
//html file ~component/marketPrices/marketPrices.html contents
<script>
window.loadOnce("~component/marketPrices/",["marketPrices.css","marketPrices.js"]);
</script>
<!-- data-bind contains our custom Knockout.JS binding that requests 'component.marketPrices' module and binds view to its body --> 
<div data-bind="withModule:'component.marketPrices'">
...
</div>
```

If you want to farther automate script loading, you can provide your simpleDefine function with a map of files that contain modules and it will autoload them when they are needed.

```javascript
		window.simpleDefine.useModuleFileInfoMap([
			{
				moduleNamespace: "myApp.services.userDetails",
				filePath: "~services/userDetails.js"
			},
			{
				moduleNamespace: "myApp.ui.gridHelpers",
				filePath: "~ui/heleplers/gridHelpres.js"
			}
			//... more mappings. We autogenerate this map during build by scanning all js files with a regex porvided below.
		]);

```
The map is produced with a little bit of code on application build \ application start by scaning all JS files in front-end relevant folders and searching their text with regex:

```javascript
var regexp = /simpleDefine\s*\(\s*["']([a-zA-Z0-9\.]*)["']\s*\,/;
var result = regexp.exec('window.simpleDefine("myApp.admin.controllers.warehouse",["services.warehouse"],');
result[1];	//"myApp.admin.controllers.warehouse"
```

## Test suit and browser support
The test suit includes most of the scenarios we could think of and their combinations. We run it against the Evergreen browsers (latest Chrome, FF, Edge) and additionally IE11; 

## Developing this code
After downloading the repo, install infrastructure:
```javascript
npm install -g typescript
npm install
```
Start TypeScript comipler, it is configured to run in file watch mode.
```
tsc
```
Run testing suit (also runs in watch mode):
```
npm test
```
