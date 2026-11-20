/* Live translucent honey, rendered from the actual moving outline.
   A blurred volume field supplies rounded surface normals. Amber absorption,
   refraction of the hero image, and reflected light supply the material.
   Canvas 2D keeps the same material available without requiring WebGL. */
(function () {
  'use strict';
  window.createHoneyMaterial = function (edge, hero) {
    const canvas=document.createElement('canvas');
    canvas.className='honey-material';canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');
    const mask=document.createElement('canvas'), rounded=document.createElement('canvas');
    const m=mask.getContext('2d',{willReadFrequently:true}), b=rounded.getContext('2d',{willReadFrequently:true});
    if(!ctx||!m||!b)return null;
    const photo=hero.querySelector('.hero-photo');
    const photoCanvas=document.createElement('canvas');
    const pc=photoCanvas.getContext('2d',{willReadFrequently:true});
    let imagePixels=null,imageW=768,imageH=432;
    let width=0,ratio=1,lastDraw=0,healthy=true,output=null;
    const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
    const random=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};
    // Precompute lighting and absorption so each live frame uses table lookups.
    const absorption=new Float32Array(256*3),lighting=new Float32Array(129*129*8);
    for(let h=0;h<256;h++){
      const thick=.11+1.23*Math.pow(h/255,.78);
      absorption[h*3]=Math.exp(-.2*thick);absorption[h*3+1]=Math.exp(-.88*thick);absorption[h*3+2]=Math.exp(-3.2*thick);
    }
    for(let ix=0;ix<129;ix++)for(let iy=0;iy<129;iy++){
      let nx=(ix-64)/32,ny=(iy-64)/32;const length=Math.sqrt(nx*nx+ny*ny+1);nx/=length;ny/=length;const nz=1/length;
      const rx=2*nz*nx,ry=2*nz*ny;
      const sky=Math.exp(-Math.pow((rx+.32)/.23,2)-Math.pow((ry-.15)/.9,2));
      const sky2=Math.exp(-Math.pow((rx-.62)/.13,2)-Math.pow((ry+.15)/.65,2));
      const sun=Math.pow(Math.max(0,nx*-.272+ny*.371+nz*.888),85);
      const shine=sky*.68+sky2*.18+sun*.22;
      const i=(ix*129+iy)*8;
      lighting.set([nx,ny,rx,ry,.025+.5*Math.pow(1-nz,4),shine,shine*.96,shine*.79],i);
    }

    function loadPhoto(){
      try{
        imageH=Math.round(imageW*photo.naturalHeight/photo.naturalWidth);
        photoCanvas.width=imageW;photoCanvas.height=imageH;
        pc.drawImage(photo,0,0,imageW,imageH);imagePixels=pc.getImageData(0,0,imageW,imageH).data;
      }catch(_){imagePixels=null;}
    }
    if(photo.complete&&photo.naturalWidth)loadPhoto();else photo.addEventListener('load',loadPhoto,{once:true});
    edge.append(canvas);
    function fraction(v){if(v==='top'||v==='left')return 0;if(v==='right'||v==='bottom')return 1;if(v==='center')return .5;return(parseFloat(v)||0)/100;}
    function resize(w){
      width=w;ratio=Math.min(1,1100/w);
      canvas.width=mask.width=rounded.width=Math.round(w*ratio);
      canvas.height=mask.height=rounded.height=Math.round(480*ratio);
      output=ctx.createImageData(canvas.width,canvas.height);
    }
    return {
      render(path,time,flow,force){
        if(!healthy)return;
        const now=performance.now();if(!force&&now-lastDraw<40)return;lastDraw=now;
        const w=hero.clientWidth;if(width!==w)resize(w);
        try{
          const W=canvas.width,H=canvas.height;
          m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,W,H);
          m.setTransform(ratio,0,0,ratio,0,60*ratio);m.fillStyle='#fff';m.fill(new Path2D(path));
          b.clearRect(0,0,W,H);b.filter=`blur(${14*ratio}px)`;b.drawImage(mask,0,0);b.filter='none';
          const sharp=m.getImageData(0,0,W,H).data, soft=b.getImageData(0,0,W,H).data;
          const pixels=output.data;pixels.fill(0);
          const hRect=hero.getBoundingClientRect(),eRect=edge.getBoundingClientRect();
          const lip=60+hRect.bottom-eRect.top;
          const fit=Math.max(w/(photo.naturalWidth||w),hRect.height/(photo.naturalHeight||hRect.height));
          const drawW=(photo.naturalWidth||w)*fit,drawH=(photo.naturalHeight||hRect.height)*fit;
          const pos=getComputedStyle(photo).objectPosition.split(' ');
          const offX=(w-drawW)*fraction(pos[0]),offY=(hRect.height-drawH)*fraction(pos[1]||'0%');
          for(let y=0;y<H;y++){
            const up=Math.max(0,y-2)*W*4,down=Math.min(H-1,y+2)*W*4;
            const py=y/ratio;
            for(let x=0;x<W;x++){
              const i=(y*W+x)*4,a=sharp[i+3];if(a<2)continue;
              const px=x/ratio,alpha=soft[i+3],h=alpha/255;
              const left=(y*W+Math.max(0,x-2))*4,right=(y*W+Math.min(W-1,x+2))*4;
              const left3=(y*W+Math.max(0,x-3))*4,right3=(y*W+Math.min(W-1,x+3))*4;
              const dx=-(soft[right+3]-soft[left+3]+soft[right3+3]-soft[left3+3])/510*11.2;
              const up3=Math.max(0,y-3)*W*4,down3=Math.min(H-1,y+3)*W*4;
              const dy=(soft[down+x*4+3]-soft[up+x*4+3]+soft[down3+x*4+3]-soft[up3+x*4+3])/510*11.2;
              const li=(clamp(Math.round(dx*32)+64,0,128)*129+clamp(Math.round(dy*32)+64,0,128))*8;
              const nx=lighting[li],ny=lighting[li+1];
              const tr=absorption[alpha*3],tg=absorption[alpha*3+1],tb=absorption[alpha*3+2];
              const refrX=px+nx*(9+24*h),heroY=hRect.height-lip+py-ny*(9+24*h);
              let br=.9686,bg=.9569,bb=.9216;
              if(imagePixels&&heroY<hRect.height+24){
                const ix=clamp(Math.round((refrX-offX)/drawW*(imageW-1)),0,imageW-1);
                const iy=clamp(Math.round((heroY-offY)/drawH*(imageH-1)),0,imageH-1);
                const index=(iy*imageW+ix)*4;
                const side=.73-.61*clamp(refrX/(w*.85),0,1);
                const lower=.34*clamp((heroY/hRect.height-.6)/.4,0,1);
                const shade=(1-side)*(1-lower)/255;
                const diffuse=clamp((heroY-hRect.height+16)/40,0,1);
                br=imagePixels[index]*shade*(1-diffuse)+br*diffuse;
                bg=imagePixels[index+1]*shade*(1-diffuse)+bg*diffuse;
                bb=imagePixels[index+2]*shade*(1-diffuse)+bb*diffuse;
              }
              let r=br*tr+(1-tr)*.16,g=bg*tg+(1-tg)*.096,bl=bb*tb+(1-tb)*.0192;
              let er=.23,eg=.27,eb=.15;
              if(imagePixels){
                const ix=clamp(Math.round((.5+lighting[li+2]*.4)*(imageW-1)),0,imageW-1);
                const iy=clamp(Math.round((.31-lighting[li+3]*.28)*(imageH-1)),0,imageH-1);
                const index=(iy*imageW+ix)*4;er=imagePixels[index]/255;eg=imagePixels[index+1]/255;eb=imagePixels[index+2]/255;
              }
              const fresnel=lighting[li+4];
              r=r*(1-fresnel)+(er*.75+.13)*fresnel;
              g=g*(1-fresnel)+(eg*.75+.09)*fresnel;
              bl=bl*(1-fresnel)+(eb*.75+.025)*fresnel;
              pixels[i]=clamp((r+lighting[li+5])*255,0,255);
              pixels[i+1]=clamp((g+lighting[li+6])*255,0,255);
              pixels[i+2]=clamp((bl+lighting[li+7])*255,0,255);pixels[i+3]=a;
            }
          }
          m.setTransform(1,0,0,1,0,0);m.putImageData(output,0,0);
          ctx.clearRect(0,0,W,H);ctx.filter='blur(.65px)';ctx.drawImage(mask,0,0);ctx.filter='none';
          // Tiny bubbles travel with the honey, clipped to its live silhouette.
          ctx.save();ctx.setTransform(ratio,0,0,ratio,0,60*ratio);ctx.clip(new Path2D(path));
          for(let j=1;j<=12;j++){
            const x=random(j)*w+Math.sin(time*.3+j)*2;
            const y=5+random(j+12)*48+Math.sin(time*.45+j)*2+flow*1.5;
            const radius=.7+random(j+27)*1.1;
            ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.strokeStyle='rgba(255,236,172,.28)';ctx.lineWidth=.55;ctx.stroke();
          }
          ctx.restore();edge.classList.add('has-honey-material');edge.dataset.materialStatus='active';
        }catch(_){healthy=false;edge.classList.remove('has-honey-material');edge.dataset.materialStatus='svg-fallback';}
      }
    };
  };
})();
