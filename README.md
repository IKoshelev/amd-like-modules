# amd-like-modules
### What this is
AMD like modules for existing JS projects that allow gradual convertion to modularised code rather than requiring convertion of entire old codebase.

This project arose because we have a large existing JavaScript code base using either no modules at all or namespace objects on window and we need to start using a better module system, while maintaining interop between old and new code. First consideration was RequireJS using AMD modules, but the team strugled with it due to naming issues and several libraries changing their behaviour when they detected availability of RequireJS, thus breaking old code. Mixing old and new code was also a problem. Since the application was bundled anyway and we were after code structure rather than code file loading aspect of AMD, we decided to write a small library that would give us just that functionality.

Thus, lib/amd-like-modules.js will provide your browser with the following functionality:

```javascript
        window.simpleDefine("myApp.viewmodels.userDetailsVmFactory", 
        [myApp.services.userDetails,// pass existing dependency, i.e. from nested object on window
         myApp.ui.util.gridHelpers,
         _,
         Q], 
        function (userDetailsSrv, gridHelpers,_,Q) {
          //module body starts here
          function UserDetailsVm(details,activity){
            ...
          };
          
          ...
          
          funtion factoryFn(userId){
            return Q.
              all([
                userDetailsSrv.getDetails(userId), 
                userDetailsSrv.getActivity(userId)])
              .then(function (values) {
                  return new UserDetailsVm(values[0],values[1]);
              });
          }
          
          // return of the module
          return factoryFn; 
          
        });
        
        // from old code you can still access new modules like this:
        var userDetailsVmFactory = window.myApp.viewmodels.userDetailsVmFactory;
```

this will allow you to have AMD-like code structure and use old existing namespaced code with it. It will also expose new modules via namespaces, so that they can be accessed from old code. This way, you can write all new code in AMD-like modules, but leave old code as is for the time being, untill you are finally ready to switch fully.

### What this is not
This library does not handle file loading. Because your code most likely already has JS code bundling or loading manually by ordered script tags - just continue doing that for now. By default it also will NOT handle dependency resolution - it is up to you to pass dependencies, which also means, it is up to you to manually maintain loading order of modules. However, see experiemental features for switches to enable async resolution.

### Experimental features
One feature we found usefull is to search for corresponding namespace chain in each branch where depending module is descendant:
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

Another feature we found we could use is resolving modules by last namespace or two, to make code shorter for uniquer namespace combinations:
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

Finally, if at least one of the above features is enabled, it is possible to resolve some of the dependencies later. You can activate resolution recheck for all modules that still have unresolved dependencies with each successful module load.

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
		//"myApp.admin.scheduleCtrl" will be rechecked asynchronously 
		//in the next availalbe event loop iteration
		//and it will also load
		window.simpleDefine("myApp.admin.scheduleSrv",
		        [],
		        function(){
                        // module body
		});
```
asyncResolutionTimeout also serves to prevent modules being stuck in limbo - if no new modules have been successfully loaded (i.e. with all their dependencies resolved and body executed) for that given duration, and modules with unresolved dependencies still exist - an error will be thrown.

### Test suit and browser support
The test suit includes most of the scenarios we could think of and their combinations. We run it against the Evergreen browsers (latest Chrome, FF, IE11) and additionally IE8; 

### Developing this code
After downloading the repo, install infrastructure:
```
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
