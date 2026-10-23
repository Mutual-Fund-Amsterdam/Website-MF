import {registerHooks} from 'node:module';
// Node's test runner can execute our TS directly; production resolves these via Next.
registerHooks({resolve(specifier,context,next){
 if(specifier==='server-only')return {url:'data:text/javascript,export%20%7B%7D',shortCircuit:true};
 if(specifier==='next/headers')return next('next/headers.js',context);
 try{return next(specifier,context);}catch(error){
  if(error.code==='ERR_MODULE_NOT_FOUND'&&(specifier.startsWith('./')||specifier.startsWith('../'))&&!/\.[cm]?[jt]sx?$/.test(specifier))return next(specifier+'.ts',context);
  throw error;
 }
}});
