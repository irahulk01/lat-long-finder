import fs from 'fs';

async function testRedirect() {
    const url = "https://maps.app.goo.gl/xoXH9TqEcXTqTRsEA";
    console.log(`Testing native fetch follow on: ${url}`);
    
    try {
        const response = await fetch(url);
        const html = await response.text();

        const metaUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i) 
          || html.match(/<meta\s+content="([^"]+)"\s+property="og:url"/i);

        let finalUrl = "";

        if (metaUrlMatch) {
            console.log("Found og:url:", metaUrlMatch[1]);
            finalUrl = metaUrlMatch[1];
        } else {
            console.log("No og:url found. Checking og:image...");
            const metaImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) 
              || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
              
            if (metaImageMatch) {
                console.log("Found og:image:", metaImageMatch[1]);
                finalUrl = metaImageMatch[1];
            }
        }

        if (finalUrl) {
            console.log("Testing extraction on:", finalUrl);
            // New regex for center param (URL decoded or likely encoded as %2C)
            // decoding the URL first is safer usually, but let's try regex on raw first
             const demoUrlDecoded = decodeURIComponent(finalUrl);
             console.log("Decoded URL:", demoUrlDecoded);

             const centerMatch = demoUrlDecoded.match(/[?&]center=(-?\d+\.\d+),(-?\d+\.\d+)/);
             if (centerMatch) {
                 console.log(`✅ SUCCESS: Extracted from center param: Lat ${centerMatch[1]}, Lng ${centerMatch[2]}`);
             } else {
                 console.log("❌ FAIL: Could not extract from center param.");
             }
        } else {
            console.log("❌ FAIL: No URL found to extract from.");
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testRedirect();
