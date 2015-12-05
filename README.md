# amd-like-modules
### What this is
AMD like modules for existing JS projects that allow gradual convertion to modularised code rather than requiring convertion of entire old codebase.

This project arised from the need to work with a large existing JavaScript base using either no modules at all or namespace objects on window to a better module system. First consideration was RequireJS using AMD modules, but team strugled with it due to naming issues and several libraries changing their behaviour when they detected availability of RequireJS, thus breaking old code. Since the application was bundled anyway and we were after the code structure rather then code file loading aspect of AMD, we decided to write a small library that would give us just that functionality.

Thus, lib/amd-like-modules.js will provide your browser with the following functionality:

```javascript
        window.simpleDefine("myApp.viewmodels.userDetailsVmFactory", 
        [myApp.services.userDetails,
         myApp.ui.util.gridHelpers,
         _,
         Q], 
        function (userDetailsSrv, gridHelpers,_,Q) {
          
          function UserDetailsVm(details,activity){
            ...
          };
          
          ...
          
          return funtion(userId){
            return Q.
              all([
                userDetailsSrv.getDetails(userId), 
                userDetailsSrv.getActivity(userId)])
              .then(function (values) {
                  return new UserDetailsVm(values[0],values[1]);
              });
          }
          
        });
```

this will allow you to have AMD-like code structure and use old existing namespaced code with it. It will also expose new modules via namespaces, so that they can be accessed from old code. This way, you can write all new code in AMD modules, but leave old code as is for the time being, untill you are finally ready to switch fully.

### What this is not
This library does not handle 2 things that AMD normally handles - file loading and dependency graph resolution. Since your team probably already does this manually by ordered script tags - just continue doing that for now. 

### Experimental feature
One feature we found we could use is resolving modules by last namespace or two, to make code shorter:
```javascript
window.simpleDefine.isAllowedNamedDependencies = true;

window.simpleDefine("myApp.admin.services.warehouse", [], function () { ... });
  
        window.simpleDefine("myApp.admin.controllers.warehouse", 
              ["services.warehouse"], 
              function (warehouseSrv) {
                ...
            });
```

So long as only one module namespace chain ends in "service.warehouse", dependency will be resolved. In the future, it is possible that we will add some smarter resolution strategies, that will consider namespaces of the defining module itself during string name resolution.

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
