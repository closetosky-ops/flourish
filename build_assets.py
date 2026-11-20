from PIL import Image,ImageEnhance,ImageFilter,ImageOps
from pathlib import Path
from io import BytesIO
A=Path('/mnt/data/flourish-v9-work/assets'); A.mkdir(exist_ok=True)
root=Path('/mnt/data')
def res(name,src,box=None,size=(950,1100),focus=(0.5,0.5),bright=1.04,contrast=1.06,sat=1.04):
 im=Image.open(src).convert('RGB')
 if box:im=im.crop(box)
 w,h=im.size;target=size[0]/size[1];ar=w/h
 if ar>target:
  nw=int(h*target);left=int((w-nw)*focus[0]);im=im.crop((left,0,left+nw,h))
 else:
  nh=int(w/target);top=int((h-nh)*focus[1]);im=im.crop((0,top,w,top+nh))
 im=im.resize(size,Image.Resampling.LANCZOS)
 im=ImageEnhance.Brightness(im).enhance(bright)
 im=ImageEnhance.Contrast(im).enhance(contrast)
 im=ImageEnhance.Color(im).enhance(sat)
 im.save(A/name,'WEBP',quality=86,method=6)
 print(name, (A/name).stat().st_size)

# Concept photography generated for this campaign (AI generated, labels not verified).
res('scene-collection.webp',root/'a_warm_richly_lit_close_up_still_life_product_com.png',size=(1024,1120))
dip=Image.open(root/'a_high_end_warm_sunlit_product_still_life_diptyc.png');w,h=dip.size
res('scene-honey.webp',root/'a_high_end_warm_sunlit_product_still_life_diptyc.png',box=(0,0,int(w*.495),h),size=(800,960))
res('scene-candles.webp',root/'a_high_end_warm_sunlit_product_still_life_diptyc.png',box=(int(w*.505),0,w,h),size=(800,960))
res('scene-gifts.webp',root/'a_cinematic_warm_rustic_product_photoshoot_still.png',box=(380,110,1420,920),size=(850,860))
# In-context real market photos, crops + warm tone only, products/labels unchanged.
res('market-honey.webp',root/'IMG_0174(2).jpeg',box=(225,40,980,1180),size=(800,950),bright=1.13,contrast=1.11,sat=1.08)
res('market-honeycomb.webp',root/'IMG_0176(2).jpeg',size=(800,950),bright=1.12,contrast=1.09,sat=1.1)
res('market-candles.webp',root/'IMG_0180(2).jpeg',size=(800,950),bright=1.1,contrast=1.1,sat=1.08)
res('market-propolis.webp',root/'IMG_0179(3).jpeg',size=(800,950),bright=1.12,contrast=1.08,sat=1.08)
res('market-jars.webp',root/'IMG_0181(2).jpeg',size=(800,950),bright=1.1,contrast=1.08,sat=1.06)
res('market-candle-display.webp',root/'IMG_0178(3).jpeg',size=(850,1000),bright=1.09,contrast=1.08,sat=1.05)
res('market-stand.webp',root/'IMG_0182(2).jpeg',size=(1100,750),bright=1.13,contrast=1.09,sat=1.08)
# create a landscape collection concept from generated square
res('scene-banner.webp',root/'a_warm_richly_lit_close_up_still_life_product_com.png',size=(1500,880),focus=(.52,.49))
