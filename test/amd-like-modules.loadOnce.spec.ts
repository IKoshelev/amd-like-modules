/// <reference path="../typings/tsd.d.ts" />

interface Window {
	testScriptLoadCounter: number;
}

describe("amd-like-modules.loadOnce",()=>{
    
   window.loadOnce.appSubPath = "/base/test/files-available-to-tests/";
    
   function endsWith(str:string, suffix:string) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };
    
    function getTestScriptTags(suffix: string = 'test-script.js' ): HTMLScriptElement[]{
        var scriptTags = document.getElementsByTagName('script');
        var srcMatches:HTMLScriptElement[] = [];
        
        for(var count1 = 0; count1 < scriptTags.length; count1++){
            var tag = scriptTags[count1];
            if(endsWith(tag.src,suffix)){
                srcMatches.push(tag);
            }
        }
        
        return srcMatches;
    }
    
    function getTestLinkTags(suffix: string = 'test-sheet.css'): HTMLLinkElement[]{
        var linkTags = document.getElementsByTagName('link');
        var hrefMatches:HTMLLinkElement[] = [];
        
        for(var count1 = 0; count1 < linkTags.length; count1++){
            var tag = linkTags[count1];
            if(endsWith(tag.href,suffix)){
                hrefMatches.push(tag);
            }
        }
        
        return hrefMatches;
    }
    
    function deleteAll(tags : HTMLElement[]){
        for(var count1 = 0; count1 < tags.length; count1++){
            var tag = tags[count1];
            tag.parentNode.removeChild(tag);
        }
    }
    
    afterEach(() => {
        
        if(typeof window.testScriptLoadCounter != 'undefined'){
            window.testScriptLoadCounter = undefined;
        }
        
        var createdScriptTags = getTestScriptTags();
        deleteAll(createdScriptTags);
  
        var createdLinkTags = getTestLinkTags();
        deleteAll(createdLinkTags);

        
        window.loadOnce.appSubPath = "/base/test/files-available-to-tests/";
        
	});
    
    it("should provide loadOnce function on window object",()=>{
		expect(window.loadOnce).toBeDefined();
		expect(typeof window.loadOnce).toBe("function");
	});
    
   it("should be able to load scripts",(done)=>{

        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        },100);
	});
    
   it("should be able to load links",(done)=>{
        window.loadOnce(["/base/test/files-available-to-tests/test-sheet.css"]);
        setTimeout(() => {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            done();
        },100);
	});
    
   it("can handle multiple files from the same base path",(done)=>{
        window.loadOnce("/base/test/files-available-to-tests/",
                            ["test-sheet.css",
                            "test-script.js"]);
        setTimeout(() => {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            var tags2 = getTestScriptTags();
            expect(tags2.length).toBe(1);
            done();
        },100);

	});
    
    it("throws exception on wrong arguments",() => {
       expect(() => (<any>window).loadOnce()).toThrow();
       expect(() => (<any>window).loadOnce("")).toThrow();
       expect(() => (<any>window).loadOnce("",{})).toThrow();
    });
    
    it("ignores empty paths",() => {      
       var tagsBefore = document.getElementsByTagName('script');
       window.loadOnce([""]);
       var tagsAfter = document.getElementsByTagName('script');
       
       expect(tagsBefore.length == tagsAfter.length);
    });
    
    it("throws exception when unknown file type  encountered",() => {
       expect(() => window.loadOnce(["/base/test/files-available-to-tests/test-sheet.bar"])).toThrow();
    });
    
    it("known script types can be extended with specified 'type' attribute value",(done) => {
       window.loadOnce.acceptableFileTypesForScript["service"] = "text/javascript";
       window.loadOnce(["~test-file.service"]);
             
       setTimeout(() => {
            var tag = getTestScriptTags("service")[0];
            expect(tag).toBeDefined();
            expect(tag.type).toBe("text/javascript");
            expect(window.testScriptLoadCounter).toBe(1);
            tag.parentNode.removeChild(tag);
            done();
        }, 100);
    });
    
    it("should not load same script twice (script url are compared case-insansitively)",(done)=>{

        window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
           
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            window.loadOnce(["/base/test/files-available-to-tests/test-script.js"]);
        },100);
        
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            window.loadOnce(["/Base/Test/Files-available-to-tests/Test-script.js"]);
        },200);
        
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        },300);
        
	});
    
    it("should substitute placeholder for app subpath",(done)=>{
        window.loadOnce(["~test-script.js"]);
        
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        },100);             
	});
    
    it("should substitute placeholder for app subpath if placeholder is part of base path",(done)=>{
        window.loadOnce("~test-",["sheet.css","script.js"]);
        
        setTimeout(() => {
            var tags = getTestLinkTags();
            expect(tags.length).toBe(1);
            var tags2 = getTestScriptTags();
            expect(tags2.length).toBe(1);
            done();
        },100);            
	});
    
   it("should allow to set placeholder for app subpath",(done)=>{

        window.loadOnce.subPathPlaceholder = '{marker}';
        window.loadOnce(["{marker}test-script.js"]);
        
        setTimeout(() => {
            var tags = getTestScriptTags();
            expect(tags.length).toBe(1);
            expect(window.testScriptLoadCounter).toBe(1);
            done();
        },100);
                
	});
    
    
});