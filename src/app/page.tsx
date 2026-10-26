import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { BrandLogo } from "@/components/brand-logo";

const workflow = [
  { number: "01", title: "Start with an idea", body: "Write a topic, add teaching notes, and tell ClairoVid who the explanation is for." },
  { number: "02", title: "Review the story", body: "Shape the narration and visual storyboard together before anything is rendered." },
  { number: "03", title: "Create the video", body: "Bring the approved explanation to life with narration, motion graphics, and timed captions." },
  { number: "04", title: "Share when ready", body: "Preview your video, download a vertical MP4, or connect Instagram to publish or schedule." },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  let signedIn = false;
  try {
    signedIn = Boolean(await auth.api.getSession({ headers: await headers() }));
  } catch {
    // Keep the public homepage available when the auth database cannot be reached.
  }
  const homeHref = signedIn ? "/dashboard" : "/";
  const createHref = signedIn ? "/projects/new" : "/sign-up";
  const createLabel = signedIn ? "New explainer" : "Create a video";
  return <main className="marketing cinemaHome">
    <header className="homeHeader">
      <div className="homeHeaderInner">
        <BrandLogo href={homeHref} label={signedIn ? "ClairoVid.ai — My videos" : "ClairoVid.ai home"}/>
        <nav className="homeNav" aria-label="Main navigation"><a href="#workflow">How it works</a><a href="#storyboard">Storyboard</a><a href="#delivery">Video output</a></nav>
        <div className="homeActions"><Link href={signedIn ? "/dashboard" : "/sign-in"} className="homeSignIn">{signedIn ? "My videos" : "Sign in"}</Link><Link href={createHref} className="button homeCta">{createLabel} <span aria-hidden="true">↗</span></Link></div>
        <details className="mobileNav"><summary aria-label="Open navigation menu"><span></span><span></span></summary><nav aria-label="Mobile navigation"><a href="#workflow">How it works</a><a href="#storyboard">Storyboard</a><a href="#delivery">Video output</a><Link href={signedIn ? "/dashboard" : "/sign-in"}>{signedIn ? "My videos" : "Sign in"}</Link><Link href={createHref}>{createLabel} <span aria-hidden="true">↗</span></Link></nav></details>
      </div>
    </header>

    <section className="cinemaHero" aria-labelledby="hero-title">
      <div className="cinemaHeroInner">
        <div className="cinemaHeroCopy">
          <div className="eyebrow"><span className="eyebrowRule"/> EDUCATIONAL VIDEO, MADE CLEAR</div>
          <h1 id="hero-title">Complex ideas,<br/><em>clearly in motion.</em></h1>
          <p className="heroLead">Turn a topic or teaching notes into a short educational explainer. Review the script and storyboard together, then bring the approved idea to video.</p>
          <div className="heroActions"><Link href={createHref} className="button homeCta">{createLabel} <span aria-hidden="true">↗</span></Link><a className="textLink" href="#workflow">See how it works <span aria-hidden="true">↓</span></a></div>
          <p className="heroFootnote">A focused V1 for 60–90 second English explainers.</p>
        </div>
        <div className="heroPreviewWrap">
          <div className="previewKicker"><span>01 / EXPLAINER STUDY</span><span>SCHEMATIC PREVIEW</span></div>
          <div className="heroPreview" role="img" aria-label="Schematic educational video frame explaining how water flows downhill">
            <svg viewBox="0 0 440 560" aria-hidden="true" className="riverDiagram">
              <defs><linearGradient id="riverSurface" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#567A67"/><stop offset="1" stopColor="#283F38"/></linearGradient><linearGradient id="riverFlow" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#E58C33"/><stop offset="1" stopColor="#F2C078"/></linearGradient></defs>
              <rect width="440" height="560" fill="#101217"/><path d="M0 0h440v560H0z" fill="url(#riverSurface)" opacity=".18"/>
              <path d="M0 178 90 120l62 41 62-84 64 48 72-76 90 53v160L0 312z" fill="#354A3E"/><path d="m0 243 79-37 67 38 73-57 60 35 73-53 88 42v165L0 403z" fill="#536451"/><path d="m0 330 79-31 77 40 72-42 71 30 63-42 78 29v246H0z" fill="#756447"/>
              <path d="M38 185 97 162m78-16 46-29m80 18 55-31" fill="none" stroke="#A3A5A0" strokeWidth="2" strokeDasharray="4 9" opacity=".8"/>
              <path d="M71 199v58m-9-12 9 12 9-12M217 154v75m-9-12 9 12 9-12M354 118v106m-9-12 9 12 9-12" fill="none" stroke="#F5F5F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M30 356c70-26 77 16 141-3s88-42 136-20 69 12 106-18" fill="none" stroke="url(#riverFlow)" strokeWidth="8" strokeLinecap="round"/><path d="m385 304 27 11-13 24" fill="none" stroke="#E58C33" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <g fill="#F5F5F3" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="1.6"><text x="27" y="95">HIGHER GROUND</text><text x="278" y="276">DOWNHILL</text></g>
              <circle cx="335" cy="86" r="22" fill="#E58C33" opacity=".9"/><circle cx="335" cy="86" r="31" fill="none" stroke="#E58C33" opacity=".25"/>
              <rect x="0" y="451" width="440" height="109" fill="#090A0D" opacity=".94"/><text x="28" y="480" fill="#E58C33" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">THE WATER CYCLE · 03 / 06</text><text x="28" y="512" fill="#F5F5F3" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="600">Water moves downhill</text><text x="28" y="536" fill="#A1A5AD" fontFamily="Arial,sans-serif" fontSize="12">Gravity pulls water from high ground to low.</text>
            </svg>
            <div className="previewFoot"><span>SCHEMATIC FRAME · ESTIMATED TIMING</span><span>01 / 06</span></div>
          </div>
          <div className="previewCaption"><span className="captionWave" aria-hidden="true">▮ ▮▮ ▮ ▮▮▮ ▮</span><span>“Gravity pulls water from high ground to low.”</span><span className="captionStatus">CAPTION PREVIEW</span></div>
        </div>
      </div>
      <div className="heroIndex" aria-hidden="true"><span>01</span><i/><span>04</span></div>
    </section>

    <section className="workflowSection" id="workflow"><div className="contentWrap"><div className="sectionIntro"><div><div className="eyebrow"><span className="eyebrowRule"/> FROM IDEA TO EXPLAINER</div><h2>Four steps.<br/><em>You stay in control.</em></h2></div><p>Review the combined script and storyboard before generation. Approve the finished video before you publish or schedule it.</p></div><div className="workflowTrack">{workflow.map((step, index) => <article className="workflowStep" key={step.number}><div className="workflowStepTop"><span>{step.number}</span><i className={index === 1 ? "approvalDot" : ""}/></div><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></div></section>

    <section className="storySection" id="storyboard"><div className="contentWrap storyGrid"><div className="storyCopy"><div className="eyebrow"><span className="eyebrowRule"/> THE STORYBOARD IS YOUR REVIEW GATE</div><h2>Make the story<br/>make sense <em>first.</em></h2><p>ClairoVid brings narration and scene direction into one storyboard. Adjust the explanation, ask for a conversational revision, and approve the story before video generation begins.</p><ul className="featureList"><li><span>01</span><div><b>Script and visuals together</b><small>Review what is said alongside what appears on screen.</small></div></li><li><span>02</span><div><b>Revisions in plain language</b><small>Ask for a simpler opening or a clearer example.</small></div></li><li><span>03</span><div><b>Approval before generation</b><small>Your edits stay yours; generation waits for your approval.</small></div></li></ul><Link href={createHref} className="textLink">Start with an idea <span aria-hidden="true">↗</span></Link></div><div className="storyBoardMock" aria-label="Illustrative storyboard preview"><div className="mockHeader"><span>STORYBOARD / BINARY SEARCH</span><span>EST. 01:18</span></div><div className="mockScene active"><span className="sceneIndex">01</span><div><small>NARRATION</small><p>“Let’s find a name in a phone book. Would you start at the first page?”</p><div className="sceneBars"><i/><i/><i/></div></div></div><div className="mockScene"><span className="sceneIndex">02</span><div><small>ON SCREEN</small><p>Show the book splitting into two equal parts.</p><div className="splitDiagram"><i/><i/><i/><i/><i/><i/><i/></div></div></div><div className="mockScene"><span className="sceneIndex">03</span><div><small>NARRATION</small><p>“Check the middle. Halve the search.”</p><div className="sceneBars short"><i/><i/></div></div></div><div className="mockApproval"><span>✓</span> Your storyboard is ready for review <b>APPROVAL REQUIRED</b></div></div></div></section>

    <section className="outputSection" id="delivery"><div className="contentWrap outputGrid"><div className="outputVisual"><div className="outputCard"><div className="outputCardTop"><span>VIDEO / VERSION 01</span><span className="outputBadge">PREVIEW</span></div><div className="outputPortrait"><svg viewBox="0 0 260 360" role="img" aria-label="Abstract motion graphic of binary search"><rect width="260" height="360" fill="#161a1c"/><text x="18" y="34" fill="#A1A5AD" fontSize="10" letterSpacing="1.5">FIND THE MIDDLE</text><g fontFamily="Arial,sans-serif" fontSize="14" textAnchor="middle"><rect x="16" y="104" width="30" height="38" rx="4" fill="#30343A"/><text x="31" y="128" fill="#A1A5AD">12</text><rect x="51" y="104" width="30" height="38" rx="4" fill="#30343A"/><text x="66" y="128" fill="#A1A5AD">23</text><rect x="86" y="104" width="30" height="38" rx="4" fill="#30343A"/><text x="101" y="128" fill="#A1A5AD">35</text><rect x="121" y="100" width="38" height="46" rx="5" fill="#E58C33"/><text x="140" y="128" fill="#090A0D" fontWeight="700">42</text><rect x="164" y="104" width="30" height="38" rx="4" fill="#30343A"/><text x="179" y="128" fill="#A1A5AD">56</text><rect x="199" y="104" width="30" height="38" rx="4" fill="#30343A"/><text x="214" y="128" fill="#A1A5AD">71</text></g><path d="M140 165v50m-8-10 8 10 8-10" stroke="#E58C33" strokeWidth="2" fill="none"/><rect x="23" y="247" width="214" height="68" rx="6" fill="#090A0D"/><text x="130" y="274" fill="#A1A5AD" fontFamily="Arial,sans-serif" fontSize="10" textAnchor="middle">“Check the middle.”</text><text x="130" y="296" fill="#F5F5F3" fontFamily="Arial,sans-serif" fontWeight="600" fontSize="13" textAnchor="middle">Halve the search.</text></svg></div><div className="outputCardFooter"><span>▮▮▮▮▮▮▮▮</span><span>CAPTIONS SYNCED</span></div></div><div className="outputAnnotation"><span className="annotationLine"/> Motion graphics<br/>with narration & captions</div></div><div className="outputCopy"><div className="eyebrow"><span className="eyebrowRule"/> MADE TO WATCH, EASY TO SHARE</div><h2>A clear idea,<br/><em>ready to play.</em></h2><p>The V1 design brings narration, motion graphics, and captions together in a vertical explainer. It is designed for 1080p MP4 download and publishing or scheduling through an eligible connected Instagram account.</p><div className="outputSpecs"><div><b>9:16</b><span>VERTICAL VIDEO</span></div><i/><div><b>1080p</b><span>MP4 EXPORT</span></div><i/><div><b>30</b><span>FRAMES / SEC</span></div></div><p className="outputFineprint">Instagram publishing depends on an eligible connected account. MP4 download is designed to remain available independently.</p><Link href={createHref} className="button homeCta">{createLabel} <span aria-hidden="true">↗</span></Link></div></div></section>

    <section className="faqSection" id="faq"><div className="contentWrap faqGrid"><div><div className="eyebrow"><span className="eyebrowRule"/> A FEW USEFUL DETAILS</div><h2>Good to know<br/><em>before you begin.</em></h2></div><div className="faqList"><details><summary>What kind of videos does ClairoVid make?</summary><p>V1 is focused on English educational explainers, typically 60–90 seconds long, with explanatory motion graphics, narration, and captions.</p></details><details><summary>Can I edit the script before it makes a video?</summary><p>Yes. Review the narration and storyboard together, make changes or request a conversational revision, then approve the story before generation.</p></details><details><summary>Do I need Instagram to download my video?</summary><p>No. Preview and MP4 download are separate from Instagram. Connect an eligible account only if you want to publish or schedule there.</p></details><details><summary>Who can create an account?</summary><p>ClairoVid.ai accounts are for individual creators. Create an account to start a private project workspace.</p></details></div></div></section>

    <section className="closingSection"><div className="contentWrap closingInner"><div className="eyebrow"><span className="eyebrowRule"/> HAVE AN IDEA TO EXPLAIN?</div><h2>Let’s give it<br/><em>a clearer story.</em></h2><Link href={createHref} className="button homeCta">{createLabel} <span aria-hidden="true">↗</span></Link><p>Start with a topic. Shape the story together.</p></div></section>
    <footer className="homeFooter"><div className="contentWrap footerInner"><BrandLogo href={homeHref} label={signedIn ? "ClairoVid.ai — My videos" : "ClairoVid.ai home"}/><p>Complex ideas, clearly in motion.</p><div><Link href={signedIn ? "/dashboard" : "/sign-in"}>{signedIn ? "My videos" : "Sign in"}</Link><a href="#workflow">How it works</a></div><small className="footerNote">ClairoVid.ai · Product preview</small></div></footer>
  </main>;
}
