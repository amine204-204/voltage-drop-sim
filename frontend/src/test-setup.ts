/* Angular publishes partially-compiled code (ngDeclareFactory) in node_modules;
   loading the JIT compiler here lets vitest instantiate components without the Angular Linker. */
import '@angular/compiler';
