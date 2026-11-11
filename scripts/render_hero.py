#!/usr/bin/env python3
"""Create original StarApple caimito-derived particle hero film (CC0 external assets: none).

Reproducible: deterministic seeded particle coordinates, 6s seamless animation.
Needs numpy, opencv-python-headless, ffmpeg command. Produces H264 MP4 and poster WEBP.
"""
from __future__ import annotations
import argparse
import math
import subprocess
from pathlib import Path

import cv2
import numpy as np


def render(out_dir: Path, width: int = 960, height: int = 540, fps: int = 20, seconds: int = 6) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(20261111)
    x, y = np.meshgrid(np.linspace(-1.45, 1.45, 142), np.linspace(-.96, .96, 75))
    x, y = x.flatten(), y.flatten()
    # Cinematic stippled wave wraps around a negative-space star.
    phase = rng.uniform(-np.pi, np.pi, len(x))
    weights = rng.uniform(.58, 1, len(x))
    offsets = rng.uniform(-.006,.006, (len(x), 2))
    # fine pinprick field provides depth against rich graphite blacks.
    dust_x = rng.uniform(0, width, 330)
    dust_y = rng.uniform(0, height, 330)
    dust_sz = rng.uniform(.35,1.6,330)
    # Sculpted five-pointed core, dedicated set of orbiting particles.
    n_core = 2800
    core_ang = rng.uniform(0, 2 * np.pi, n_core)
    core_rand = np.sqrt(rng.uniform(.015, 1, n_core))
    core_phase = rng.uniform(-np.pi, np.pi, n_core)
    core_z = rng.normal(0, .18, n_core)
    # Arc ribbons, like a technical nebula scan.
    arc_ang = np.linspace(0, 2*np.pi, 600)

    output = out_dir / 'starapple-core.mp4'
    args = ['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24',
            '-s',f'{width}x{height}','-r',str(fps),'-i','-','-an','-c:v','libx264',
            '-preset','medium','-crf','30','-pix_fmt','yuv420p','-movflags','+faststart',
            '-profile:v','high',str(output)]
    ff = subprocess.Popen(args, stdin=subprocess.PIPE)
    yy, xx = np.mgrid[:height, :width]
    # Ambient luminosity is all local original gradients, no licensed textures.
    aura_1 = np.exp(-(((xx-width*.74)/(width*.31))**2+((yy-height*.49)/(height*.52))**2)*2.5)
    aura_2 = np.exp(-(((xx-width*.97)/(width*.13))**2+((yy-height*.16)/(height*.26))**2)*2.2)
    aura_3 = np.exp(-(((xx-width*.65)/(width*.17))**2+((yy-height*.82)/(height*.21))**2)*2.5)
    base = np.zeros((height,width,3), np.uint8)
    base[:,:,:] = [9, 7, 7]
    base[:,:,0] = np.clip(7+22*aura_1+9*aura_2,0,255)
    base[:,:,1] = np.clip(8+8*aura_1+8*aura_3,0,255)
    base[:,:,2] = np.clip(10+17*aura_1+5*aura_2,0,255)
    bg=base.copy()
    for px,py,size in zip(dust_x,dust_y,dust_sz):
        cv2.circle(bg,(int(px),int(py)),int(size >= 1.2), (23,22,24),-1,cv2.LINE_AA)

    total = fps * seconds
    for i in range(total):
        t = i / total * np.pi * 2
        frame = bg.copy()
        # Multiple wave sheets form the near-architectural smoky strata in Unkey's poster,
        # but the choreography, colors, geometry and five-point core are StarApple-original.
        wave = .19*np.sin(x*4.1+t) + .11*np.cos(y*8.1-t) + .10*np.sin(x*2.1+y*5.2-t)
        mx = x + .17*np.sin(y*3.1+t) + offsets[:,0]
        my = y + wave + offsets[:,1]
        # Twist entire soft field around the fruit's mathematical star profile.
        angle = .12*np.sin(t)
        X = mx*np.cos(angle)-my*np.sin(angle)
        Y = mx*np.sin(angle)+my*np.cos(angle)
        px = np.rint(width*(.73+X*.37)).astype(np.int32)
        py = np.rint(height*(.48+Y*.46)).astype(np.int32)
        inb = (px>=0)&(px<width)&(py>=0)&(py<height)
        hx = X+.10
        hy = Y*.97
        r = np.sqrt(hx*hx+hy*hy)+1e-6
        a = np.arctan2(hy,hx)
        star_r = (.23 + .145*np.cos(a*5-np.pi/2)) * (1+.065*np.sin(t))
        void = np.clip((r-star_r-.02)/.19,0,1)
        radiance = np.exp(-((r-.54)**2)/.2)
        density = np.clip(.22+.47*radiance+.26*np.sin(X*2.6+t*.73)**2,0,1)
        dot_lum = (weights*(.16+.73*density)*void*245).astype(np.uint8)
        # Pixel-perfect tiny ellipse dots with occasional larger pixels.
        for k in np.where(inb & (dot_lum>12))[0]:
            v = int(dot_lum[k]); sx=int(px[k]); sy=int(py[k]);
            # Burgundy-violet monochrome cloud gets a slight cold lavender tint.
            col=(min(235,int(v*.91)),min(205,int(v*.79)),min(244,int(v*.99)))
            if k%23==0:cv2.circle(frame,(sx,sy),2,col,-1,cv2.LINE_AA)
            else:frame[sy,sx]=col
        # Deliberately physical five-lobed caimito core illuminated from within.
        a = core_ang + .22*np.sin(t)
        outer = .37 + .185*np.cos(a*5-np.pi/2)
        radius = outer*core_rand * (1 + .08*np.sin(t+core_phase))
        rot = .08*np.sin(t)
        cx = .73*width; cy=.48*height
        rx = radius*np.cos(a+rot); ry=radius*np.sin(a+rot)
        # Live breathing / orbiting core has 3D parallax and a delicate rim.
        ix=np.rint(cx+width*(rx*.55+core_z*.025)).astype(np.int32)
        iy=np.rint(cy+height*(ry*.97+core_z*.05)).astype(np.int32)
        in_core=(ix>=2)&(ix<width-2)&(iy>=2)&(iy<height-2)
        # reveal peaks after 2 seconds, then ebbs smoothly for seamless looping
        reveal=(.30 + .70*(.5-.5*np.cos(t)))
        for k in np.where(in_core)[0]:
            rr=core_rand[k]
            glow = (1-rr**.9)*reveal
            if glow < .055: continue
            base_lum=int(56+168*glow)
            c=(min(255,int(base_lum*1.05)),min(255,int(base_lum*.68)),min(255,int(base_lum*1.18)))
            sz=2 if k%19==0 else 1
            cv2.circle(frame,(int(ix[k]),int(iy[k])),sz,c,-1,cv2.LINE_AA)
        # Hand-built star outline as dotted mathematical curve, offset from dense core.
        for j in range(0,600,2):
            ang=arc_ang[j]+rot
            rad=(.37+.185*math.cos((arc_ang[j])*5-math.pi/2))*1.015
            sx=int(cx+width*.55*rad*math.cos(ang));sy=int(cy+height*.97*rad*math.sin(ang))
            if 1<sx<width-1 and 1<sy<height-1:
                alpha=.35+.65*reveal
                cv2.circle(frame,(sx,sy),1,(int(150*alpha),int(90*alpha),int(232*alpha)),-1,cv2.LINE_AA)
        # Floating geometric node squares, StarApple signature lilac + magenta + jade.
        for j in range(17):
            aj=(j*2.39996322972865 +t*.37)
            rr=.21+.59*((j*7%17)/17)
            px0=int(cx + width*.39*rr*math.cos(aj))
            py0=int(cy + height*.61*rr*math.sin(aj))
            sz=(6,4,3,7,2)[j%5]
            if 0<px0<width-sz and 0<py0<height-sz:
                clr=((226,109,216),(184,122,242),(192,153,252),(156,207,128))[j%4]
                cv2.rectangle(frame,(px0,py0),(px0+sz,py0+sz),clr,-1)
        # Minimal scan reticles in shadow; never overlays marketing copy.
        for shift in [0.26,.74]:
            rx0=int(width*shift)
            ry0=int(height*(.15+.05*math.sin(t+shift*2)))
            cv2.line(frame,(rx0-6,ry0),(rx0+6,ry0),(50,42,58),1,cv2.LINE_AA)
            cv2.line(frame,(rx0,ry0-6),(rx0,ry0+6),(50,42,58),1,cv2.LINE_AA)
        if i==int(total*.25):
            cv2.imwrite(str(out_dir/'starapple-core-poster.webp'),frame,[cv2.IMWRITE_WEBP_QUALITY,87])
        assert ff.stdin is not None
        ff.stdin.write(frame.tobytes())
    assert ff.stdin is not None
    ff.stdin.close()
    if ff.wait()!=0:raise RuntimeError('ffmpeg failed')
    # Save a deterministic static alternative if anything skipped the image frame.
    if not (out_dir/'starapple-core-poster.webp').exists():
        cv2.imwrite(str(out_dir/'starapple-core-poster.webp'),bg)
    print('Created',output,output.stat().st_size,'bytes')


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out-dir',type=Path,default=Path('public/media'))
    parser.add_argument('--width',type=int,default=960)
    parser.add_argument('--height',type=int,default=540)
    parser.add_argument('--fps',type=int,default=20)
    parser.add_argument('--seconds',type=int,default=6)
    args=parser.parse_args()
    render(args.out_dir,args.width,args.height,args.fps,args.seconds)