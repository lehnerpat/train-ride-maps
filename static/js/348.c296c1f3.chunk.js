"use strict";(self.webpackChunktrm_react_ui=self.webpackChunktrm_react_ui||[]).push([[348],{9878:function(r,e,t){t.d(e,{Z:function(){return s}});var n=t(5861),a=t(5671),i=t(3144),o=t(7757);function u(r,e){var t=r.length-e,n=0;do{for(var a=e;a>0;a--)r[n+e]+=r[n],n++;t-=e}while(t>0)}function c(r,e,t){for(var n=0,a=r.length,i=a/t;a>e;){for(var o=e;o>0;--o)r[n+e]+=r[n],++n;a-=e}for(var u=r.slice(),c=0;c<i;++c)for(var f=0;f<t;++f)r[t*c+f]=u[(t-f-1)*i+c]}function f(r,e,t,n,a,i){if(!e||1===e)return r;for(var o=0;o<a.length;++o){if(a[o]%8!==0)throw new Error("When decoding with predictor, only multiple of 8 bits are supported.");if(a[o]!==a[0])throw new Error("When decoding with predictor, all samples must have the same size.")}for(var f=a[0]/8,s=2===i?1:a.length,h=0;h<n&&!(h*s*t*f>=r.byteLength);++h){var l=void 0;if(2===e){switch(a[0]){case 8:l=new Uint8Array(r,h*s*t*f,s*t*f);break;case 16:l=new Uint16Array(r,h*s*t*f,s*t*f/2);break;case 32:l=new Uint32Array(r,h*s*t*f,s*t*f/4);break;default:throw new Error("Predictor 2 not allowed with ".concat(a[0]," bits per sample."))}u(l,s)}else 3===e&&c(l=new Uint8Array(r,h*s*t*f,s*t*f),s,f)}return r}var s=function(){function r(){(0,a.Z)(this,r)}return(0,i.Z)(r,[{key:"decode",value:function(){var r=(0,n.Z)(o.mark((function r(e,t){var n,a,i,u,c;return o.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:return r.next=2,this.decodeBlock(t);case 2:if(n=r.sent,1===(a=e.Predictor||1)){r.next=9;break}return i=!e.StripOffsets,u=i?e.TileWidth:e.ImageWidth,c=i?e.TileLength:e.RowsPerStrip||e.ImageLength,r.abrupt("return",f(n,a,u,c,e.BitsPerSample,e.PlanarConfiguration));case 9:return r.abrupt("return",n);case 10:case"end":return r.stop()}}),r,this)})));return function(e,t){return r.apply(this,arguments)}}()}]),r}()},6348:function(r,e,t){t.r(e),t.d(e,{default:function(){return u}});var n=t(5671),a=t(3144),i=t(136),o=t(7277),u=function(r){(0,i.Z)(t,r);var e=(0,o.Z)(t);function t(){return(0,n.Z)(this,t),e.apply(this,arguments)}return(0,a.Z)(t,[{key:"decodeBlock",value:function(r){for(var e=new DataView(r),t=[],n=0;n<r.byteLength;++n){var a=e.getInt8(n);if(a<0){var i=e.getUint8(n+1);a=-a;for(var o=0;o<=a;++o)t.push(i);n+=1}else{for(var u=0;u<=a;++u)t.push(e.getUint8(n+u+1));n+=a+1}}return new Uint8Array(t).buffer}}]),t}(t(9878).Z)}}]);
//# sourceMappingURL=348.c296c1f3.chunk.js.map