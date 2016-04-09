/// <reference path="../typings/tsd.d.ts" />

interface Window {
	testScriptLoadCounter: number;
}

describe("amd-like-modules.loadOnce",()=>{
    
   function endsWith(str:string, suffix:string) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };
    
    function getTestScriptTags(): HTMLScriptElement[]{
        var scriptTags = document.getElementsByTagName('script');
        var srcMatches:HTMLScriptElement[] = [];
        
        for(var count1 = 0; count1 < scriptTags.length; count1++){
            var tag = scriptTags[count1];
            if(endsWith(tag.src,'test-script.js')){
                srcMatches.push(tag);
            }
        }
        
        return srcMatches;
    }
    
    afterEach(() => {
        
        if(typeof window.testScriptLoadCounter != 'undefined'){
            delete window.testScriptLoadCounter;
        }
        
        var createdScriptTags = getTestScriptTags();
        
        for(var count1 = 0; count1 < createdScriptTags.length; count1++){
            var tag = createdScriptTags[count1];
            tag.parentNode.removeChild(tag);
        }
        
	});
    
    it("should provide loadOnce function on window object",()=>{
		expect(window.loadOnce).toBeDefined();
		expect(typeof window.loadOnce).toBe("function");
	});
    
   it("should be able to load scripts",(done)=>{

        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        var tags = getTestScriptTags();
        setTimeout(() => {
            debugger;
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        },50);
	});
    
    
});