interface Window {
	simpleDefine(
				moduleNamespace: String, 
				moduleDependencies: any[], 
				moduleBody: (...args: any[])=>any):void;
}

window.simpleDefine = (() =>{  
	return function(moduleNamespace: String, 
				moduleDependencies: any[], 
				moduleBody: (...args: any[])=>any){
					
				};
})(); 