#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const HTML_FILE=path.join(__dirname,'..','docs','index.html');
const html=fs.readFileSync(HTML_FILE,'utf8');
const jsMatch=html.match(/<script>([\s\S]*?)<\/script>/);
const js=jsMatch?jsMatch[1]:'';
let passed=0,failed=0;
function check(name,ok,detail){
  if(ok){console.log('  \u2705 '+name);passed++;}
  else{console.log('  \u274c '+name+(detail?' \u2014 '+detail:''));failed++;}
}
console.log('\n\ud83d\udd0d AyurAI Validation');
console.log('  File: '+HTML_FILE);
console.log('  Size: '+(fs.statSync(HTML_FILE).size/1024).toFixed(1)+' KB\n');
// 1. JS Syntax
console.log('1. JS Syntax:');
const tmpJs=path.join(os.tmpdir(),'ayurai_validate.js');
fs.writeFileSync(tmpJs,js);
try{cp.execSync('node --check "'+tmpJs+'"',{stdio:'pipe'});check('JS syntax valid',true);}
catch(e){const d=(e.stderr||'').toString().split('\n').find(l=>l.includes('SyntaxError'))||'';check('JS syntax valid',false,d.trim());}
// 2. Required functions
console.log('\n2. Required Functions:');
['initApp','doLogin','doSignup','doLogout','checkFood','renderFoodResult','getRemedy','resetFoodCheck',
 'initDinacharya','generateDinacharya','renderDinacharya','renderDinacharya_StartScreen',
 'initHerbAdvisor','initSymptomChecker','runSymptomCheck',
 'logError','getErrorLogs','renderErrorLogs','exportErrorLogs','clearErrorLogs',
 'loadDoshaInsights','renderDoshaInsights','exportJSON','importJSON',
 'callOpenAI','callOpenAILarge','el','setText','setHTML','showToast','switchTab',
 'initAdvAilmentChips','initMealTiming','saveFoodHistory','renderHistory','renderHomeHistory',
 'saveCity','saveApiKey',
 'isFirstTimeUser','goToOnboardingSlide','skipOnboarding','nextOnboardingSlide','replayOnboarding','initOnboardingSwipe',
 'initPWA','triggerPWAInstall'
].forEach(function(fn){check(fn+'()',js.includes('function '+fn));});
// 3. Required HTML IDs
console.log('\n3. Required HTML IDs:');
['screen-onboarding','onboarding-slide-1','onboarding-slide-2','onboarding-slide-3','onboarding-slide-4','onboarding-slide-5',
 'screen-login','screen-signup','screen-app',
 'tab-home','tab-food','tab-herbs','tab-dina','tab-settings','tab-quiz','tab-symptom','tab-history',
 'food-input','food-result-area','food-alt-area','food-hero','food-hero-chips','food-api-warning',
 'quiz-container','herbs-wrap','dina-wrap','symptom-wrap',
 'settings-name','settings-email','settings-city','settings-apikey',
 'settings-error-log','import-file-input',
 'home-greeting','home-name','home-dosha-val','home-dosha-pills','home-dosha-insights','home-recent-checks',
 'pwa-install-btn','pwa-ios-hint','pwa-install-section'
].forEach(function(id){check('id="'+id+'"',html.includes('id="'+id+'"'));});
// 4. el() refs
console.log('\n4. el() Reference Check:');
var htmlIds=new Set();html.replace(/id="([^"]+)"/g,function(_,id){htmlIds.add(id);});
var elCalls=new Set();js.replace(/el\('([^']+)'\)/g,function(_,id){elCalls.add(id);});
var missing=Array.from(elCalls).filter(function(id){return !htmlIds.has(id);});
check('All el() calls reference existing IDs ('+elCalls.size+' checked)',missing.length===0,missing.length?missing.join(', '):'');
// 5. Duplicate functions
console.log('\n5. Duplicate Function Check:');
var fns=[];js.replace(/^function\s+(\w+)/gm,function(_,n){fns.push(n);});
var dupes=fns.filter(function(n,i){return fns.indexOf(n)!==i;});
check('No duplicate function declarations',dupes.length===0,dupes.length?Array.from(new Set(dupes)).join(', '):'');
// 6. API error handling
console.log('\n6. API Error Handling:');
var apiCalls=(js.match(/await callOpenAI/g)||[]).length;
var catches=(js.match(/\} catch\(e\)/g)||[]).length;
check(apiCalls+' API calls covered by '+catches+' catch blocks',catches>=apiCalls);
// 7. logError usage
console.log('\n7. Error Logging:');
var logCount=(js.match(/logError\(/g)||[]).length;
check('logError() called '+logCount+' times across codebase',logCount>=5);
// 8. Critical global state declarations
console.log('\n8. Global State Declarations:');
['let _remedyLoading','let dinaCache','let dinaFilterState','let herbState','let symptomState',
 'let quizState','const FOOD_CACHE_KEY','const DINA_CACHE_KEY','const COMMON_AILMENTS',
 'const DINA_DIET_PREFS','const API_ERR_STORAGE_KEY'
].forEach(function(decl){
  check(decl,js.includes(decl));
});
// Summary
console.log('\n'+'-'.repeat(44));
console.log('  Passed: '+passed+'   Failed: '+failed);
if(failed===0){console.log('  All checks passed \u2014 ready to commit!\n');process.exit(0);}
else{console.log('  '+failed+' check(s) need attention\n');process.exit(1);}
