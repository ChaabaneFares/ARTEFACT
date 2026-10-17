from pathlib import Path
import cv2,numpy as np,subprocess,imageio_ffmpeg,json,concurrent.futures,argparse
from PIL import Image
parser=argparse.ArgumentParser(description="Bake supplied logos into the eight original portfolio videos.")
parser.add_argument('--source-root',type=Path,required=True)
parser.add_argument('--logo-root',type=Path,required=True)
parser.add_argument('--output-root',type=Path,default=Path('public/assets/video/portfolio'))
parser.add_argument('--report',type=Path,default=Path('/tmp/artefact-video-processing.json'))
args=parser.parse_args()
ff=imageio_ffmpeg.get_ffmpeg_exe()
specs={
 '34hD4u8WFuI':('cozy-cafe',None),
 'xgWT3ZnPa40':('villa-pano',None),
 'NN_bmDgHre8':('pastel-pink',None),
 'xtcLIzJMSrc':('light-warm',None),
 '3BM6ZFk1JPU':('beach-villa',(579,32,122,64)),
 '17hmW5GG7P8':('nb-villa',(579,32,122,64)),
 'BcsbQNBj1kM':('la-hospital',None),
 'FiRRKVRyY2Q':('khalili-unit',(580,610,120,80)),
}
mask=np.array(Image.open(__import__('io').BytesIO(__import__('base64').b64decode(json.loads(Path('scripts/media-branding-plan.json').read_text())['sourceWatermarkMaskPng']))))
logo=Image.open(args.logo_root/'artefact-lockup.png').convert('RGBA')
args.output_root.mkdir(parents=True,exist_ok=True)
def composite(bgr,logo,x,y):
 a=np.array(logo);rgb=a[:,:,:3][:,:,::-1].astype(np.float32);alpha=(a[:,:,3:4]/255).astype(np.float32)
 target=bgr[y:y+a.shape[0],x:x+a.shape[1]]
 target[:]=np.clip(target.astype(np.float32)*(1-alpha)+rgb*alpha,0,255).astype(np.uint8)
def process(id,spec):
 name,box=spec;src=args.source_root/(id+'.mp4');out=args.output_root/(name+'.mp4')
 temporary=out.with_name('.'+out.stem+'.branding.mp4')
 cap=cv2.VideoCapture(str(src));fps=cap.get(cv2.CAP_PROP_FPS);w,h=int(cap.get(3)),int(cap.get(4));total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
 if box: box=tuple(round(v*(w/1280 if i%2==0 else h/720)) for i,v in enumerate(box))
 # Read video-only frames, then retain the original audio in the output.
 encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size',f'{w}x{h}','-framerate',str(fps),'-i','pipe:0','-i',str(src),'-map','0:v:0','-map','1:a?','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',str(temporary)],stdin=subprocess.PIPE)
 small=logo.resize((round(w*.09),round(w*.09*35/111.414)),Image.Resampling.LANCZOS)
 oldmask=None
 if box:
  x,y,bw,bh=box;oldmask=cv2.resize(mask,(bw,bh));oldmask=cv2.dilate((oldmask>15).astype(np.uint8)*255,np.ones((5,5),np.uint8))
  # The Khalili clip uses a differently scaled bottom mark. Erase its bright
  # glyphs in the reviewed fixed region instead of assuming the top template.
 n=0;outroframes=0
 while True:
  ok,bgr=cap.read()
  if not ok:break
  if box:
   x,y,bw,bh=box;pad=8;patch=bgr[max(0,y-pad):y+bh+pad,x-pad:x+bw+pad].copy();m=np.zeros(patch.shape[:2],np.uint8)
   if id=='FiRRKVRyY2Q':
    roi=patch[pad:pad+bh,pad:pad+bw];g=cv2.cvtColor(roi,cv2.COLOR_BGR2GRAY);ink=((roi.min(axis=2)>175)&(roi.max(axis=2).astype(np.int16)-roi.min(axis=2).astype(np.int16)<30)&(g.astype(np.int16)-cv2.GaussianBlur(g,(0,0),2).astype(np.int16)>8)).astype(np.uint8)*255;ink=cv2.dilate(ink,np.ones((3,3),np.uint8));m[pad:pad+bh,pad:pad+bw]=ink
   else:m[pad:pad+bh,pad:pad+bw]=oldmask
   bgr[max(0,y-pad):y+bh+pad,x-pad:x+bw+pad]=cv2.inpaint(patch,m,4,cv2.INPAINT_TELEA)
  # Villa's animated end card is on a black canvas. Replace both the old
  # emblem and the subsequent AM-ARC.COM title while retaining its fade.
  isoutro=False
  if id=='xgWT3ZnPa40' and n/fps>40:
   outside=np.concatenate([bgr[:h//4].reshape(-1,3),bgr[3*h//4:].reshape(-1,3)])
   isoutro=np.mean(outside)<2 and np.mean(bgr)<15
  if isoutro:
   brightness=int(np.max(bgr));bgr[:]=0
   big=logo.resize((round(w*280/1280),round(h*88/720)),Image.Resampling.LANCZOS);a=np.array(big);a[:,:,3]=(a[:,:,3].astype(np.float32)*min(1,brightness/240)).astype(np.uint8)
   composite(bgr,Image.fromarray(a),round((w-big.width)/2),round((h-big.height)/2));outroframes+=1
  else:
   y=round(h*.89) if box and id in ['3BM6ZFk1JPU','17hmW5GG7P8'] else round(h*.91)
   # Reuse the existing top-center position in concept clips.
   if box and id in ['3BM6ZFk1JPU','17hmW5GG7P8']:y=round(44*h/720)
   composite(bgr,small,round((w-small.width)/2),y)
  encoder.stdin.write(bgr.tobytes());n+=1
 cap.release();encoder.stdin.close();result=encoder.wait()
 if result or n!=total:raise RuntimeError((id,result,n,total))
 temporary.replace(out)
 print(name,n,'frames',outroframes,'replaced outro frames',flush=True)
 return {'sourceId':id,'path':str(out),'frames':n,'fps':fps,'size':[w,h],'outroFrames':outroframes,'removedWatermark':box}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
 results=list(executor.map(lambda item:process(*item),specs.items()))
args.report.write_text(json.dumps(results,indent=2))
