import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function POST(request:Request){
 const {url}=await request.json().catch(()=>({}));
 if(!url||!/^https?:\/\//i.test(url))return NextResponse.json({error:'A valid project URL is required.'},{status:400});
 let browser:any;
 try{browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(url,{waitUntil:'networkidle',timeout:30000});const title=await page.title();const screenshot=await page.screenshot({type:'png',fullPage:true});const images=await page.locator('img').evaluateAll((els:any[])=>els.slice(0,12).map((img:any)=>({src:img.currentSrc||img.src,alt:img.alt||''})).filter((x:any)=>x.src));return NextResponse.json({asset:{kind:'website_capture',source:url,title,url:`data:image/png;base64,${Buffer.from(screenshot).toString('base64')}`},images});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to capture project.'},{status:422});}finally{await browser?.close();}
}
