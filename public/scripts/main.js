/* Redefine theme main script, ported for Astro.
   Reads configuration from window.theme (injected by the layout). */
(() => {
	const theme = window.theme || {};

	/* ---------------------------------------------------------- */
	/* Helpers                                                      */
	/* ---------------------------------------------------------- */

	const $ = (selector, root = document) => root.querySelector(selector);
	const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

	const styleStatus = {
		isDark: document.documentElement.classList.contains('dark'),
		isOpenPageAside: theme.articles?.toc?.init_open !== false,
	};

	function getStyleStatus() {
		try {
			const raw = localStorage.getItem('REDEFINE-THEME-STATUS');
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === 'object' ? parsed : null;
		} catch {
			return null;
		}
	}

	function updateStyleStatus(updates = {}) {
		Object.assign(styleStatus, updates);
		try {
			localStorage.setItem('REDEFINE-THEME-STATUS', JSON.stringify(styleStatus));
		} catch {
			/* ignore */
		}
	}

	const t = (path, fallback = '') => {
		const segments = String(path || '').split('.').filter(Boolean);
		let current = window.i18n;
		for (const segment of segments) {
			if (!current || typeof current !== 'object') return fallback;
			current = current[segment];
		}
		return typeof current === 'string' ? current : fallback;
	};

	/* ---------------------------------------------------------- */
	/* Theme (dark / light) toggle                                  */
	/* ---------------------------------------------------------- */

	function applyTheme(isDark) {
		const root = document.documentElement;
		root.classList.add(isDark ? 'dark' : 'light');
		root.classList.remove(isDark ? 'light' : 'dark');
		root.style.colorScheme = isDark ? 'dark' : 'light';
		updateStyleStatus({ isDark });
		const icon = $('#theme-toggle i');
		if (icon) {
			icon.className = isDark ? 'fa-regular fa-brightness' : 'fa-regular fa-moon';
		}
		initMermaid();
		setGiscusTheme(isDark ? 'dark' : 'light');
		setUtterancesTheme(isDark ? 'dark' : 'light');
	}

	function setGiscusTheme() {
		const frame = $('iframe.giscus-frame');
		const container = $('#giscus-container');
		if (!frame || !container) return;
		const setConfig = {
			theme: styleStatus.isDark ? 'dark' : 'light',
		};
		frame.contentWindow?.postMessage({ giscus: { setConfig } }, 'https://giscus.app');
	}

	function setUtterancesTheme() {
		const container = $('#utterances-container');
		const frame = $('iframe.utterances-frame');
		if (!container || !frame) return;
		const themeName = styleStatus.isDark
			? container.dataset.utterancesThemeDark || 'github-dark'
			: container.dataset.utterancesThemeLight || 'github-light';
		frame.contentWindow?.postMessage({ type: 'set-theme', theme: themeName }, 'https://utteranc.es');
	}

	let modeToggleInitialized = false;
	function initModeToggle() {
		const stored = getStyleStatus();
		if (stored && typeof stored.isDark === 'boolean') {
			applyTheme(stored.isDark);
		}
		if (modeToggleInitialized) return;
		modeToggleInitialized = true;
		// 事件委托：swup 切换页面后元素会被替换，委托在 document 上才能持续生效
		document.addEventListener('click', (event) => {
			if (event.target.closest('#theme-toggle')) {
				applyTheme(!document.documentElement.classList.contains('dark'));
			}
		});
	}

	/* ---------------------------------------------------------- */
	/* Navbar: shrink, drawer, submenus                             */
	/* ---------------------------------------------------------- */

	let navbarHeight = 0;

	function handleNavbarScroll() {
		const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		document.body.dataset.navbarSize = scrollTop > navbarHeight ? 'compact' : 'full';
	}

	function setDrawerState(isOpen) {
		const toggle = $('#navbar-toggle');
		const drawer = $('#navbar-drawer');
		const mask = $('#navbar-mask');
		toggle?.setAttribute('aria-expanded', String(isOpen));
		if (drawer) {
			drawer.dataset.state = isOpen ? 'open' : 'closed';
			drawer.setAttribute('aria-hidden', String(!isOpen));
		}
		if (mask) {
			mask.dataset.state = isOpen ? 'open' : 'closed';
			mask.setAttribute('aria-hidden', String(!isOpen));
			mask.tabIndex = isOpen ? 0 : -1;
		}
		document.body.dataset.navbarDrawer = isOpen ? 'open' : 'closed';
	}

	let navbarGlobalsInitialized = false;
	function initNavbarGlobals() {
		if (navbarGlobalsInitialized) return;
		navbarGlobalsInitialized = true;
		window.addEventListener('scroll', handleNavbarScroll, { passive: true });

		document.addEventListener('click', (event) => {
			const submenuToggle = event.target.closest('[data-navbar-submenu]');
			if (submenuToggle) {
				const target = document.getElementById(submenuToggle.getAttribute('aria-controls'));
				if (target) {
					const isVisible = !target.hidden;
					submenuToggle.setAttribute('aria-expanded', String(!isVisible));
					target.hidden = isVisible;
				}
				return;
			}

			if (event.target.closest('[data-navbar-close]')) {
				setDrawerState(false);
				return;
			}

			if (event.target.closest('#navbar-toggle, #navbar-mask')) {
				const isOpen = $('#navbar-toggle')?.getAttribute('aria-expanded') === 'true';
				setDrawerState(!isOpen);
			}
		});
	}

	function initNavbarPage() {
		const navbar = $('#navbar');
		if (navbar) {
			navbarHeight = navbar.getBoundingClientRect().height;
			handleNavbarScroll();
		}
		setDrawerState(false);
	}

	/* ---------------------------------------------------------- */
	/* Side tools                                                   */
	/* ---------------------------------------------------------- */

	let toolsMenuOpen = theme.global?.side_tools?.auto_expand === true;

	function applyToolsMenuState() {
		const menu = $('#side-tools-menu');
		const toggle = $('#side-tools-toggle');
		if (!menu || !toggle) return;
		menu.dataset.state = toolsMenuOpen ? 'open' : 'closed';
		menu.setAttribute('aria-hidden', String(!toolsMenuOpen));
		toggle.setAttribute('aria-expanded', String(toolsMenuOpen));
	}

	function updateAutoHideTools() {
		const tools = $('#side-tools');
		if (!tools) return;
		const y = window.scrollY;
		const height = document.documentElement.scrollHeight;
		const windowHeight = window.innerHeight;
		const isScrollable = height > windowHeight;
		const shouldHide =
			(y <= 100 && location.pathname === '/') || (isScrollable && y + windowHeight >= height - 20);
		const state = shouldHide ? 'hidden' : 'visible';
		if (tools.dataset.state !== state) {
			tools.dataset.state = state;
			tools.setAttribute('aria-hidden', String(shouldHide));
			tools.inert = shouldHide;
		}
	}

	let sideToolsInitialized = false;
	function initSideTools() {
		if (!sideToolsInitialized) {
			sideToolsInitialized = true;
			// 事件委托：swup 切换页面后按钮元素会被替换
			document.addEventListener('click', (event) => {
				if (event.target.closest('#side-tools-toggle')) {
					toolsMenuOpen = !toolsMenuOpen;
					applyToolsMenuState();
				}
			});
		}
		applyToolsMenuState();
		updateAutoHideTools();
	}

	/* ---------------------------------------------------------- */
	/* 首页侧栏滚动钳位：同步滚动，底部不超过屏幕中间              */
	/* ---------------------------------------------------------- */

	function updateSidebarClamp() {
		const aside = $('.post-home-aside');
		if (!aside) return;
		const navH = parseFloat(getComputedStyle(document.body).getPropertyValue('--current-navbar-height')) || 72;
		const maxTop = navH + 16;
		const halfViewport = window.innerHeight / 2;
		const height = aside.offsetHeight;
		// 侧栏不超过半屏：正常吸顶；超过半屏：让底部（最新文章）停在屏幕中间
		const top = height >= halfViewport ? halfViewport - height : maxTop;
		aside.style.top = `${Math.round(top)}px`;
	}

	let sidebarClampInitialized = false;
	function initSidebarClamp() {
		if (!sidebarClampInitialized) {
			sidebarClampInitialized = true;
			window.addEventListener('resize', updateSidebarClamp, { passive: true });
		}
		updateSidebarClamp();
	}

	/* ---------------------------------------------------------- */
	/* Scroll progress + scroll buttons                             */
	/* ---------------------------------------------------------- */

	let prevScrollValue = 0;

	function updateScrollStyle() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight;
		const clientHeight = window.innerHeight || document.documentElement.clientHeight;

		const hasScrollPercent = theme.global?.scroll_progress?.percentage === true;
		if (hasScrollPercent) {
			const backToTop = $('#scroll-top');
			const percentDom = backToTop?.querySelector('[data-scroll-percent]');
			if (backToTop && percentDom) {
				let percent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
				if (isNaN(percent) || percent < 0 || !isFinite(percent)) percent = 0;
				if (percent > 100) percent = 100;
				backToTop.dataset.state = percent !== 0 ? 'visible' : 'hidden';
				percentDom.innerHTML = String(percent);
			}
		}

		const progressBar = $('#reading-progress');
		if (theme.global?.scroll_progress?.bar === true && progressBar) {
			let percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
			if (isNaN(percent) || percent < 0 || !isFinite(percent)) percent = 0;
			if (percent > 100) percent = 100;
			progressBar.style.visibility = percent === 0 ? 'hidden' : 'visible';
			progressBar.style.width = `${percent.toFixed(3)}%`;
			progressBar.setAttribute('aria-valuenow', String(Math.round(percent)));
		}

		const pageTop = $('#page-header');
		if (pageTop) {
			if (theme.navbar?.auto_hide) {
				const hidePageTop = prevScrollValue > clientHeight && scrollTop > prevScrollValue;
				pageTop.dataset.state = hidePageTop ? 'hidden' : 'visible';
			} else {
				pageTop.dataset.state = 'visible';
			}
		}
		prevScrollValue = scrollTop;
	}

	let scrollButtonsInitialized = false;
	function initScrollTopBottom() {
		if (scrollButtonsInitialized) return;
		scrollButtonsInitialized = true;
		document.addEventListener('click', (event) => {
			if (event.target.closest('#scroll-top')) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			if (event.target.closest('#scroll-bottom')) {
				window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
			}
		});
	}

	/* ---------------------------------------------------------- */
	/* Home banner                                                 */
	/* ---------------------------------------------------------- */

	/* 首页 banner 多图轮换 + 玻璃击碎特效：每 8s 换一张，
	   旧图从随机撞击点波纹式碎成不规则多边形、3D 翻滚抛散下坠，新图垫底静止；
	   破碎由 WebGL2 单 canvas 实例化渲染（GPU 结算，主线程零开销），无 WebGL2 时回退 DOM 碎片 */
	const BANNER_SWAP_INTERVAL = 8000;
	let bannerSwapTimer = null;
	let bannerShatterLock = false;
	let bannerThemeObserver = null;
	let bannerStage = null; // { bg, cur, nxt, lists, idx }

	const bannerImageLists = () => {
		const image = theme.home_banner?.image || {};
		const toList = (value) => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []);
		return { light: toList(image.light), dark: toList(image.dark) };
	};

	/* 当前主题对应的图片池；本池为空时回退另一池 */
	const activeBannerList = (lists) => {
		const dark = document.documentElement.classList.contains('dark');
		const list = dark ? lists.dark : lists.light;
		return list.length ? list : dark ? lists.light : lists.dark;
	};

	const absUrl = (src) => new URL(src, window.location.href).href;

	/* object-fit:cover 下图片在容器内的实际显示矩形（碎片背景按它对齐，避免拉伸错位） */
	const coverRect = (img, w, h) => {
		const iw = img.naturalWidth || w;
		const ih = img.naturalHeight || h;
		const scale = Math.max(w / iw, h / ih);
		const dw = iw * scale;
		const dh = ih * scale;
		return { dw, dh, ox: (w - dw) / 2, oy: (h - dh) / 2 };
	};

	function stopBannerSwapper() {
		if (bannerSwapTimer) {
			window.clearInterval(bannerSwapTimer);
			bannerSwapTimer = null;
		}
		if (bannerThemeObserver) {
			bannerThemeObserver.disconnect();
			bannerThemeObserver = null;
		}
		bannerStage = null;
		bannerShatterLock = false;
	}

	/* 纯淡入淡出：prefers-reduced-motion 降级、暗色切换换池时使用 */
	function fadeBannerTo(nextSrc) {
		const stage = bannerStage;
		if (!stage) return;
		stage.currentSrc = nextSrc;
		const { cur, nxt } = stage;
		if (bannerShatterLock) {
			/* 碎裂进行中：cur 已隐藏，直接瞬时切换（清理时会从 currentSrc 收尾） */
			cur.src = nextSrc;
			return;
		}
		nxt.style.transition = 'opacity 0.6s ease';
		nxt.style.transform = 'none';
		nxt.src = nextSrc;
		nxt.style.opacity = '1';
		setTimeout(() => {
			if (bannerStage !== stage) return;
			cur.src = nextSrc;
			cur.style.opacity = '1';
			nxt.style.transition = 'none';
			nxt.style.opacity = '0';
		}, 620);
	}

	/* ---------------------------------------------------------- */
	/* WebGL 碎片渲染器：破碎特效整个搬进 1 块 canvas（1 次 draw）  */
	/* ---------------------------------------------------------- */

	/* 顶点着色器：全部物理（侵蚀前沿延迟、cubic-bezier 缓动、3D 翻滚、
	   缺口生长、perspective:900px 透视）都在 GPU 里按 uTime 结算 */
	const BANNER_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner; /* 角点相对碎片中心的偏移；中心顶点为 (0,0) */
layout(location = 1) in vec2 aUV;
layout(location = 2) in float aEdge;  /* 0=沿水平边切角 1=沿竖直边切角 -1=中心顶点不切 */
layout(location = 3) in vec2 aCenter;
layout(location = 4) in float aDelay;
layout(location = 5) in float aDur;
layout(location = 6) in vec2 aDelta;
layout(location = 7) in vec4 aBase;
layout(location = 8) in float aCut;   /* 该顶点的切角深度(px) */
layout(location = 9) in vec4 aWind; /* x:摆动相位 y:摆动频率 z:摆动幅度 w:托起高度 */
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform vec2 uPerp; /* 垂直于风向的单位向量（摆动用） */
uniform float uFocal;
uniform float uTime;
out vec2 vUV;
out float vAlpha;

float bezierX(float t) {
	float u = 1.0 - t;
	return 3.0 * u * u * t * 0.22 + 3.0 * u * t * t * 0.36 + t * t * t;
}
float bezierXd(float t) {
	float u = 1.0 - t;
	return 3.0 * u * (1.0 - 3.0 * t) * 0.22 + 3.0 * t * (2.0 - 3.0 * t) * 0.36 + 3.0 * t * t;
}
float bezierY(float t) {
	float u = 1.0 - t;
	return 3.0 * u * u * t * 0.61 + 3.0 * u * t * t + t * t * t;
}
/* CSS cubic-bezier(0.22, 0.61, 0.36, 1)：牛顿法反解 t，复刻 DOM 版缓动 */
float easeTransform(float x) {
	float t = clamp(x, 0.0, 1.0);
	for (int i = 0; i < 4; i++) {
		float err = bezierX(t) - x;
		float d = max(bezierXd(t), 0.001);
		t = clamp(t - err / d, 0.0, 1.0);
	}
	return bezierY(t);
}
mat3 rotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotZ(float a) { float c = cos(a); float s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

void main() {
	/* 与 DOM 版同款时序：transform 缓动 / 缺口 ease-in（前 35%）/ 透明 ease-in（后 55%） */
	float e = easeTransform(clamp((uTime - aDelay) / aDur, 0.0, 1.0));
	float pj = clamp((uTime - aDelay) / max(aDur * 0.99, 0.001), 0.0, 1.0);
	float ej = pj * pj;
	float pa = clamp((uTime - (aDelay + aDur * 0.42)) / max(aDur * 0.55, 0.001), 0.0, 1.0);
	vAlpha = 1.0 - pa * pa;

	/* 切角：起爆后角点沿所在边内缩形成斜边（切深随 ej 生长），
	   静止时切深×0 即完美矩形无缝拼合，起爆后四边形随机变成五~八边形 */
	vec2 c = aCorner;
	if (aEdge > -0.5) {
		if (aEdge < 0.5) c.x -= sign(c.x) * aCut * ej;
		else c.y -= sign(c.y) * aCut * ej;
	}

	/* 吹拂感：脱落后被风托起（先升后落）、垂直风向正弦摆动（阵风）、翻滚角来回抖 */
	float wobblePhase = uTime * aWind.y + aWind.x;
	float wob = sin(wobblePhase) * aWind.z * e;
	float lift = -sin(3.14159 * min(e * 1.15, 1.0)) * aWind.w;
	vec2 windOffset = aDelta * e + uPerp * wob + vec2(0.0, lift);

	float s = 1.0 - (1.0 - aBase.w) * e;
	float rz = aBase.z * e + sin(wobblePhase * 0.9) * 0.6 * e;
	vec3 p = rotX(aBase.x * e) * rotY(aBase.y * e) * rotZ(rz) * vec3(c * s, 0.0);
	vec3 world = vec3(aCenter + windOffset, 0.0) + p;

	/* 与 DOM 层 perspective:900px 一致的透视 */
	float sp = uFocal / max(uFocal - world.z, 1.0);
	vec2 clip = (world.xy - uCenter) / uHalf * sp;
	gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
	vUV = aUV;
}`;

	const BANNER_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in float vAlpha;
uniform sampler2D uTex;
out vec4 fragColor;
void main() { fragColor = texture(uTex, vUV) * vAlpha; }`;

	/* 生成全部碎片参数（GL 与 DOM 回退共用一套随机量） */
	const buildBannerShards = (wx, wy, px, py, minProj, projRange, cols, rows, cw, ch) => {
		/* 抖动缺口延迟到起爆时才出现（静止时碎片层 = 完美无缝复刻原图，不提前破碎）；
		   缺口幅度按碎片大小同比放大（6% → 14%），保持锯齿的绝对观感 */
		const jag = () => Number((Math.random() * 14).toFixed(1));
		/* 切角深度：每角 65% 概率被切，深度为所在边长的 15-45%（角顺序 TL,TR,BR,BL） */
		const cut = (len) => (Math.random() < 0.95 ? (0.5 + Math.random() * 0.3) * len : 0);
		const shards = [];
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const left = Math.round(x * cw);
				const top = Math.round(y * ch);
				const tw = Math.ceil(cw) + 2;
				const th = Math.ceil(ch) + 2;
				/* 侵蚀式破碎前沿：延迟按碎片在风向上的投影排序（扫描窗口 1200ms ≈ 消散时长） */
				const projCx = x * cw + cw / 2;
				const projCy = y * ch + ch / 2;
				const delay = ((projCx * wx + projCy * wy - minProj) / projRange) * 1200 + Math.random() * 150;
				const dur = 800 + Math.random() * 600;
				/* 被风吹走：脱离前沿后沿风向长距离卷走（500-1100px），
				   叠加横向飘摆与小幅上下扰动，配合着色器里的托起/摆动呈现吹拂感 */
				const drift = 500 + Math.random() * 600;
				const sway = (Math.random() - 0.5) * 120;
				const dx = wx * drift + px * sway;
				const dy = wy * drift + py * sway + (Math.random() - 0.5) * 60;
				shards.push({
					left,
					top,
					tw,
					th,
					cx: left + tw / 2,
					cy: top + th / 2,
					delay,
					dur,
					dx,
					dy,
					rx: (Math.random() - 0.5) * 80,
					ry: (Math.random() - 0.5) * 80,
					rz: (Math.random() - 0.5) * 540, /* 翻滚抖动 */
					scale: 0.3 + Math.random() * 0.35,
					jag: [jag(), jag(), jag(), jag()],
					cutH: [cut(tw), cut(tw), cut(tw), cut(tw)], /* 每角沿水平边的切深 */
					cutV: [cut(th), cut(th), cut(th), cut(th)], /* 每角沿竖直边的切深 */
					/* 吹拂参数：摆动相位/频率/幅度、被风托起的高度（仅 WebGL 路径使用） */
					windPhase: Math.random() * Math.PI * 2,
					windFreq: 5 + Math.random() * 8,
					windAmp: 6 + Math.random() * 14,
					windLift: 20 + Math.random() * 40,
				});
			}
		}
		return shards;
	};

	/* WebGL2 实例化渲染；任何一步失败返回 false，走 DOM 回退。px/py 为垂直风向的单位向量（摆动方向） */
	function initBannerShatterGL(stage, rect, w, h, shards, px, py) {
		const { bg, cur, nxt } = stage;
		window.__dbgShards = shards;
		window.__dbgGL = null;
		try {
			const canvas = document.createElement('canvas');
			canvas.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;';
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.max(1, Math.round(w * dpr));
			canvas.height = Math.max(1, Math.round(h * dpr));
			const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true });
			if (!gl) return false;

			const compile = (type, src) => {
				const sh = gl.createShader(type);
				gl.shaderSource(sh, src);
				gl.compileShader(sh);
				if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
				return sh;
			};
			const prog = gl.createProgram();
			gl.attachShader(prog, compile(gl.VERTEX_SHADER, BANNER_VERT));
			gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, BANNER_FRAG));
			gl.linkProgram(prog);
			if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
			gl.useProgram(prog);

			/* 顶点缓冲：每片 = 中心顶点 + 外圈 8 点（4 角 × 沿水平/竖直边各 1 个切角点）
			   的三角扇共 24 顶点；每个顶点直接携带该片的全部参数（兼容所有驱动） */
			const VSTRIDE = 20; // corner(2) uv(2) edge(1) center(2) delay(1) dur(1) delta(2) base(4) cut(1) wind(4)
			const cornerData = new Float32Array(shards.length * 24 * VSTRIDE);
			const SIGNS = [
				[-1, -1],
				[1, -1],
				[1, 1],
				[-1, 1],
			]; // TL,TR,BR,BL
			/* 外圈顺序绕周长一圈：上边两角(沿水平边) → 右边两角(沿竖直边) → 下边 → 左边 */
			const RING = [
				[0, 0],
				[1, 0],
				[1, 1],
				[2, 1],
				[2, 0],
				[3, 0],
				[3, 1],
				[0, 1],
			]; // [角序号, 0=水平边/1=竖直边]
			shards.forEach((s, i) => {
				const ringPt = ([ci, edge]) => ({
					bx: (SIGNS[ci][0] * s.tw) / 2,
					by: (SIGNS[ci][1] * s.th) / 2,
					edge,
					cut: edge === 0 ? s.cutH[ci] : s.cutV[ci],
				});
				const centerPt = { bx: 0, by: 0, edge: -1, cut: 0 };
				for (let k = 0; k < 8; k++) {
					[centerPt, ringPt(RING[k]), ringPt(RING[(k + 1) % 8])].forEach((v, j) => {
						const o = (i * 24 + k * 3 + j) * VSTRIDE;
						cornerData[o] = v.bx;
						cornerData[o + 1] = v.by;
						cornerData[o + 2] = (s.cx + v.bx - rect.ox) / rect.dw;
						cornerData[o + 3] = (s.cy + v.by - rect.oy) / rect.dh;
						cornerData[o + 4] = v.edge;
						cornerData[o + 5] = s.cx;
						cornerData[o + 6] = s.cy;
						cornerData[o + 7] = s.delay / 1000;
						cornerData[o + 8] = s.dur / 1000;
						cornerData[o + 9] = s.dx;
						cornerData[o + 10] = s.dy;
						cornerData[o + 11] = (s.rx * Math.PI) / 180;
						cornerData[o + 12] = (s.ry * Math.PI) / 180;
						cornerData[o + 13] = (s.rz * Math.PI) / 180;
						cornerData[o + 14] = s.scale;
						cornerData[o + 15] = v.cut;
						cornerData[o + 16] = s.windPhase;
						cornerData[o + 17] = s.windFreq;
						cornerData[o + 18] = s.windAmp;
						cornerData[o + 19] = s.windLift;
					});
				}
			});
			const cornerBuf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
			gl.bufferData(gl.ARRAY_BUFFER, cornerData, gl.STATIC_DRAW);
			window.__dbgGL = { gl, buf: cornerBuf, cpu: cornerData, stride: VSTRIDE, n: shards.length };
			[
				[0, 2, 0],
				[1, 2, 8],
				[2, 1, 16],
				[3, 2, 20],
				[4, 1, 28],
				[5, 1, 32],
				[6, 2, 36],
				[7, 4, 44],
				[8, 1, 60],
				[9, 4, 64],
			].forEach(([loc, size, off]) => {
				gl.enableVertexAttribArray(loc);
				gl.vertexAttribPointer(loc, size, gl.FLOAT, false, VSTRIDE * 4, off);
			});

			/* 纹理：当前图（UV 映射与 DOM 版 background-size/position 完全一致） */
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cur);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.clearColor(0, 0, 0, 0);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(gl.getUniformLocation(prog, 'uCenter'), w / 2, h / 2);
			gl.uniform2f(gl.getUniformLocation(prog, 'uHalf'), w / 2, h / 2);
			gl.uniform2f(gl.getUniformLocation(prog, 'uPerp'), px, py);
			gl.uniform1f(gl.getUniformLocation(prog, 'uFocal'), 900);
			const uTimeLoc = gl.getUniformLocation(prog, 'uTime');
			window.__dbgGL = { ...(window.__dbgGL || {}), prog, uTimeLoc };

			let maxEnd = 0;
			shards.forEach((s) => {
				maxEnd = Math.max(maxEnd, s.delay + s.dur);
			});

			let raf = 0;
			const destroy = () => {
				cancelAnimationFrame(raf);
				canvas.remove();
				gl.deleteTexture(tex);
				gl.deleteBuffer(cornerBuf);
				gl.deleteProgram(prog);
			};

			/* 首帧先画好、finish 落盘并自检通过后才挂载画布——
			   否则新图会在画布首帧就绪前透出来，出现"先切新图再飘散" */
			const t0 = performance.now();
			gl.uniform1f(uTimeLoc, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, shards.length * 24);
			gl.finish();
			if (!bannerShatterGLOK(gl, cur, rect, canvas, dpr)) {
				destroy();
				return false;
			}
			bg.appendChild(canvas);

			const frame = () => {
				if (bannerStage !== stage) {
					destroy();
					return;
				}
				const t = (performance.now() - t0) / 1000;
				gl.uniform1f(uTimeLoc, t);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(gl.TRIANGLES, 0, shards.length * 24);
				if (t * 1000 <= maxEnd + 80) {
					raf = requestAnimationFrame(frame);
					return;
				}
				destroy();
				cur.src = stage.currentSrc; /* 碎裂中途若切过主题，取主题切换后的图 */
				cur.style.opacity = '1';
				nxt.style.transition = 'none';
				nxt.style.transform = 'none';
				nxt.style.opacity = '0';
				bannerShatterLock = false;
			};
			raf = requestAnimationFrame(frame);
			return true;
		} catch (err) {
			return false;
		}
	}

	/* 首帧像素自检：帧缓冲与参考绘制逐点对比，偏差过大即判定该驱动渲染异常 */
	const bannerShatterGLOK = (gl, cur, rect, canvas, dpr) => {
		try {
			const W = canvas.width;
			const H = canvas.height;
			const ref = document.createElement('canvas');
			ref.width = W;
			ref.height = H;
			const rctx = ref.getContext('2d');
			rctx.drawImage(cur, rect.ox * dpr, rect.oy * dpr, rect.dw * dpr, rect.dh * dpr);
			const refData = rctx.getImageData(0, 0, W, H).data;
			const buf = new Uint8Array(4);
			/* 5×3 采样点均匀铺开（碎片重叠区内容一致，边界点也安全） */
			for (let r = 1; r < 4; r++) {
				for (let c = 1; c < 6; c++) {
					const sx = Math.round((c * W) / 6);
					const sy = Math.round((r * H) / 4);
					gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
					const ri = ((H - 1 - sy) * W + sx) * 4;
					if (
						Math.abs(buf[0] - refData[ri]) > 10 ||
						Math.abs(buf[1] - refData[ri + 1]) > 10 ||
						Math.abs(buf[2] - refData[ri + 2]) > 10
					) {
						return false;
					}
				}
			}
			return true;
		} catch (err) {
			return false;
		}
	};

	function runBannerShatter(nextSrc) {
		const stage = bannerStage;
		if (!stage || bannerShatterLock) return;
		bannerShatterLock = true;
		const { bg, cur, nxt } = stage;

		/* 新图垫底完全静止（不缩放落定：任何缩放都会让图顶/图底在破碎开始时上下动一下） */
		nxt.style.transition = 'none';
		nxt.src = nextSrc;
		nxt.style.opacity = '1';
		nxt.style.transform = 'none';

		const w = bg.offsetWidth;
		const h = bg.offsetHeight;
		const rect = coverRect(cur, w, h);
		/* WebGL 路径碎片数量：GPU 一次 draw call 结算，25600 片（约 7px/片）也轻松；
		   再小就成噪点粉尘了。小屏 100×64。DOM 回退在下方单独降档。 */
		const small = w < 768;
		const cols = small ? 100 : 33;
		const rows = small ? 64 : 33;
		const cw = w / cols;
		const ch = h / rows;
		/* 风向：四个对角（左下→右上、右下→左上、左上→右下、右上→左下）+ 左右水平，
		   六选一再叠 ±12° 抖动，不再总是水平吹 */
		const baseAngles = [45, 135, 225, 315, 0, 180];
		const windAngle = ((baseAngles[(Math.random() * baseAngles.length) | 0] + Math.random() * 24 - 12) * Math.PI) / 180;
		const wx = Math.cos(windAngle);
		const wy = Math.sin(windAngle);
		const px = -wy; /* 垂直于风向，用于横向飘摆 */
		const py = wx;
		/* 起爆延迟按碎片在风向上的投影排序：上风处先被吹走，形成斜向波浪 */
		const cornerProjs = [0, 0, w, 0, 0, h, w, h].reduce((acc, _, i, arr) => {
			if (i % 2 === 0) acc.push(arr[i] * wx + arr[i + 1] * wy);
			return acc;
		}, []);
		const minProj = Math.min(...cornerProjs);
		const projRange = Math.max(...cornerProjs) - minProj || 1;
		const shards = buildBannerShards(wx, wy, px, py, minProj, projRange, cols, rows, cw, ch);
		/* 碎片层已完整复刻当前图，立刻隐藏底下的原图——否则碎片飞走后露出的还是旧图，
		   清理时才瞬间跳新图（旧图重现→突变） */
		stage.currentSrc = nextSrc;

		/* WebGL 优先：1 个 canvas、1 次 draw call，GPU 结算全部动画，主线程零开销 */
		if (initBannerShatterGL(stage, rect, w, h, shards, px, py)) {
			cur.style.opacity = '0';
			return;
		}

		/* 回退：DOM 碎片（无 WebGL2 或首帧自检失败），降到 45×28 保证流畅 */
		const dcols = small ? 23 : 45;
		const drows = small ? 14 : 28;
		const domShards =
			dcols === cols && drows === rows
				? shards
				: buildBannerShards(wx, wy, px, py, minProj, projRange, dcols, drows, w / dcols, h / drows);
		const layer = document.createElement('div');
		layer.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden;perspective:900px;';
		const tiles = [];
		domShards.forEach((s) => {
			const tile = document.createElement('div');
			tile.style.cssText = [
				'position:absolute',
				`left:${s.left}px`,
				`top:${s.top}px`,
				`width:${s.tw}px`,
				`height:${s.th}px`,
				`background-image:url("${cur.src}")`,
				`background-size:${rect.dw.toFixed(1)}px ${rect.dh.toFixed(1)}px`,
				`background-position:${(rect.ox - s.left).toFixed(1)}px ${(rect.oy - s.top).toFixed(1)}px`,
				'clip-path:inset(0% 0% 0% 0%)',
				'will-change:transform,opacity,clip-path',
			].join(';');
			layer.appendChild(tile);
			tiles.push({ tile, ...s });
		});
		bg.appendChild(layer);
		cur.style.opacity = '0';

		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				let maxEnd = 0;
				tiles.forEach(({ tile, delay, dur, dx, dy, rx, ry, rz, scale, jag }) => {
					tile.style.transition =
						`transform ${dur.toFixed(0)}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delay.toFixed(0)}ms, ` +
						`opacity ${(dur * 0.55).toFixed(0)}ms ease-in ${(delay + dur * 0.45).toFixed(0)}ms, ` +
						`clip-path ${(dur * 0.35).toFixed(0)}ms ease-in ${delay.toFixed(0)}ms`;
					tile.style.transform =
						`translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) ` +
						`rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
					tile.style.opacity = '0';
					/* 缺口与飞散同时出现：消散到哪里就破碎到哪里 */
					tile.style.clipPath = `inset(${jag[0]}% ${jag[1]}% ${jag[2]}% ${jag[3]}%)`;
					maxEnd = Math.max(maxEnd, delay + dur);
				});
				setTimeout(() => {
					layer.remove();
					if (bannerStage !== stage) return;
					cur.src = stage.currentSrc; /* 碎裂中途若切过主题，取主题切换后的图 */
					cur.style.opacity = '1';
					nxt.style.transition = 'none';
					nxt.style.transform = 'none';
					nxt.style.opacity = '0';
					bannerShatterLock = false;
				}, maxEnd + 80);
			}),
		);
	}

	/* 暗色切换：同位置换另一池的图（淡入淡出，不碎裂） */
	function watchBannerTheme() {
		if (bannerThemeObserver) bannerThemeObserver.disconnect();
		bannerThemeObserver = new MutationObserver(() => {
			const stage = bannerStage;
			if (!stage) return;
			const list = activeBannerList(stage.lists);
			if (!list.length) return;
			const src = list[stage.idx % list.length];
			if (stage.cur.src !== absUrl(src)) fadeBannerTo(src);
		});
		bannerThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	}

	function initBannerSwapper() {
		const bg = $('#home-banner-background');
		if (!bg) {
			stopBannerSwapper();
			return;
		}
		if (bannerStage && bannerStage.bg === bg) return; // 当前实例已初始化
		stopBannerSwapper();

		const lists = bannerImageLists();
		const list = activeBannerList(lists);
		if (!list.length) return;

		/* SSR 两张主题图退位，自建舞台（不碰 dark: 类） */
		const ssrImgs = [...bg.querySelectorAll(':scope > img')];
		const mkImg = () => {
			const img = document.createElement('img');
			img.alt = '';
			img.setAttribute('aria-hidden', 'true');
			img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
			return img;
		};
		const nxt = mkImg();
		nxt.style.opacity = '0';
		const cur = mkImg();
		cur.src = list[0];
		const reveal = () => ssrImgs.forEach((img) => { img.style.display = 'none'; });
		if (cur.complete && cur.naturalWidth) reveal();
		else {
			cur.onload = reveal;
			cur.onerror = reveal;
		}
		bg.appendChild(nxt);
		bg.appendChild(cur);

		bannerStage = { bg, cur, nxt, lists, idx: 0, currentSrc: list[0] };
		watchBannerTheme();

		/* 空闲时预载轮换池其余图片 */
		const preloadRest = () =>
			[...lists.light, ...lists.dark].forEach((src) => {
				const img = new Image();
				img.src = src;
			});
		if ('requestIdleCallback' in window) window.requestIdleCallback(preloadRest);
		else setTimeout(preloadRest, 2000);

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		bannerSwapTimer = window.setInterval(() => {
			if (document.hidden || bannerShatterLock || !bannerStage) return;
			const active = activeBannerList(lists);
			if (active.length < 2) return;
			const nextIdx = (bannerStage.idx + 1) % active.length;
			const nextSrc = active[nextIdx];
			if (bannerStage.cur.src === absUrl(nextSrc)) return;
			/* 先预载完成再碎裂，避免碎完白屏 */
			const probe = new Image();
			probe.onload = () => {
				if (!bannerStage) return;
				bannerStage.idx = nextIdx;
				if (reduced.matches) fadeBannerTo(nextSrc);
				else runBannerShatter(nextSrc);
			};
			probe.src = nextSrc;
		}, BANNER_SWAP_INTERVAL);
	}

	function initHomeBanner() {
		const scrollButton = $('#scroll-to-main');
		scrollButton?.addEventListener('click', () => {
			$('#page-shell')?.scrollIntoView({ behavior: 'smooth' });
		});

		$$('[data-qr]').forEach((item) => {
			const trigger = item.querySelector('[data-qr-trigger]');
			trigger?.addEventListener('click', (event) => {
				event.preventDefault();
				$$('[data-qr]').forEach((other) => {
					if (other !== item) setQrState(other, false);
				});
				setQrState(item, item.dataset.state !== 'open');
			});
		});
	}

	function setQrState(item, isOpen) {
		const trigger = item.querySelector('[data-qr-trigger]');
		const popup = trigger ? document.getElementById(trigger.getAttribute('aria-controls')) : null;
		item.dataset.state = isOpen ? 'open' : 'closed';
		trigger?.setAttribute('aria-expanded', String(isOpen));
		popup?.setAttribute('aria-hidden', String(!isOpen));
	}

	let qrGlobalInitialized = false;
	function initHomeBannerGlobals() {
		if (qrGlobalInitialized) return;
		qrGlobalInitialized = true;
		document.addEventListener('click', (event) => {
			if (!event.target.closest('[data-qr]')) {
				$$('[data-qr]').forEach((item) => setQrState(item, false));
			}
		});
	}

	function updateHomeBannerBlur() {
		const background = $('#home-banner-background');
		if (!background) return;
		if (theme.home_banner?.style === 'fixed' && location.pathname === '/') {
			const scrollY = window.scrollY || window.pageYOffset;
			const blurValue = scrollY >= 0.5 * window.innerHeight ? 15 : 0;
			background.style.filter = `blur(${blurValue}px)`;
			background.style.webkitFilter = `blur(${blurValue}px)`;
		}
	}

	/* ---------------------------------------------------------- */
	/* Typed subtitle                                              */
	/* ---------------------------------------------------------- */

	let typedInstance = null;

	function initTyped() {
		const subtitle = theme.home_banner?.subtitle || {};
		const text = subtitle.text;
		const entries = Array.isArray(text) ? text : text ? [text] : [];
		const hitokoto = subtitle.hitokoto || {};

		if (entries.length === 0 && !hitokoto.enable) return;
		if (typeof window.Typed === 'undefined' || !$('#subtitle')) return;

		if (typedInstance && typeof typedInstance.destroy === 'function') {
			typedInstance.destroy();
			typedInstance = null;
		}

		const options = {
			typeSpeed: subtitle.typing_speed ?? 100,
			smartBackspace: subtitle.smart_backspace ?? false,
			backSpeed: subtitle.backing_speed ?? 80,
			backDelay: subtitle.backing_delay ?? 1500,
			loop: subtitle.loop ?? false,
			startDelay: subtitle.starting_delay ?? 500,
		};

		if (hitokoto.enable) {
			const api = hitokoto.api || 'https://v1.hitokoto.cn';
			const fetchQuote = () =>
				fetch(api)
					.then((response) => response.json())
					.then((data) => {
						const quote = data?.hitokoto || '';
						if (!quote) return '';
						const author = hitokoto.show_author && data.from_who ? `——${data.from_who}` : '';
						return `${quote}${author}`;
					});
			fetchQuote()
				.then((text) => {
					if (!text) return;
					if (!hitokoto.refresh_on_loop) {
						typedInstance = new window.Typed('#subtitle', { strings: [text], ...options });
						return;
					}
					let currentText = text;
					let nextText = null;
					let refreshing = false;
					const prefetch = () => {
						if (refreshing || nextText) return;
						refreshing = true;
						fetchQuote()
							.then((quote) => {
								nextText = quote || null;
							})
							.finally(() => {
								refreshing = false;
							});
					};
					typedInstance = new window.Typed('#subtitle', {
						strings: [currentText],
						...options,
						onStringTyped: prefetch,
						onLastStringBackspaced: (self) => {
							if (nextText) {
								currentText = nextText;
								nextText = null;
							}
							self.strings[0] = currentText;
						},
					});
				})
				.catch(() => {
					typedInstance = new window.Typed('#subtitle', { strings: entries, ...options });
				});
			return;
		}

		typedInstance = new window.Typed('#subtitle', { strings: entries, ...options });
	}

	/* ---------------------------------------------------------- */
	/* Relative dates on home cards                                */
	/* ---------------------------------------------------------- */

	function relativeTimeInHome() {
		const df = theme.home?.article_date_format;
		if (df !== 'relative' && df !== 'auto') return;
		const langAgo = window.lang_ago || {};
		const template = (value, key) => {
			const tpl = langAgo[key];
			return tpl ? tpl.replace('%s', value) : `${value} ${key}`;
		};
		const getHowLongAgo = (timestamp) => {
			const __Y = Math.floor(timestamp / (60 * 60 * 24 * 30) / 12);
			const __M = Math.floor(timestamp / (60 * 60 * 24 * 30));
			const __W = Math.floor(timestamp / (60 * 60 * 24) / 7);
			const __d = Math.floor(timestamp / (60 * 60 * 24));
			const __h = Math.floor((timestamp / (60 * 60)) % 24);
			const __m = Math.floor((timestamp / 60) % 60);
			const __s = Math.floor(timestamp % 60);
			if (__Y > 0) return template(__Y, 'year');
			if (__M > 0) return template(__M, 'month');
			if (__W > 0) return template(__W, 'week');
			if (__d > 0) return template(__d, 'day');
			if (__h > 0) return template(__h, 'hour');
			if (__m > 0) return template(__m, 'minute');
			return template(__s, 'second');
		};

		$$('[data-home-article-date]').forEach((el) => {
			const nowDate = Date.now();
			const postDate = new Date(el.dataset.date.split(' GMT')[0]).getTime();
			const diff = Math.floor((nowDate - postDate) / 1000);
			if (df === 'relative') {
				el.innerHTML = getHowLongAgo(diff);
			} else {
				const finalDays = Math.floor(diff / (60 * 60 * 24));
				if (finalDays < 7) {
					el.innerHTML = getHowLongAgo(diff);
				}
			}
		});
	}

	/* ---------------------------------------------------------- */
	/* TOC                                                         */
	/* ---------------------------------------------------------- */

	let tocSections = [];

	function updateActiveTOCLink() {
		if (tocSections.length === 0) return;
		let index = tocSections.findIndex((element) => element && element.getBoundingClientRect().top - 100 > 0);
		if (index === -1) index = tocSections.length - 1;
		else if (index > 0) index--;
		activateTOCLink(index);
	}

	function activateTOCLink(index) {
		const container = $('#article-toc');
		if (!container) return;
		const scrollArea = container.querySelector('.toc-content') ?? container;
		const navLinks = container.querySelectorAll('a.nav-link');
		const navItems = container.querySelectorAll('.nav-item');
		const target = navLinks[index];
		if (!target || target.getAttribute('aria-current') === 'location') return;
		navLinks.forEach((link) => link.removeAttribute('aria-current'));
		navItems.forEach((item) => delete item.dataset.active);
		target.setAttribute('aria-current', 'location');

		let activeItem = target.closest('.nav-item');
		while (activeItem && container.contains(activeItem)) {
			activeItem.dataset.active = 'true';
			activeItem = activeItem.parentElement?.closest('.nav-item');
		}

		const tocTop = scrollArea.getBoundingClientRect().top;
		const scrollTopOffset =
			scrollArea.offsetHeight > window.innerHeight
				? (scrollArea.offsetHeight - window.innerHeight) / 2
				: 0;
		const targetTop = target.getBoundingClientRect().top - tocTop;
		const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		const distanceToCenter = targetTop - viewportHeight / 2 + target.offsetHeight / 2 - scrollTopOffset;
		scrollArea.scrollTo({ top: scrollArea.scrollTop + distanceToCenter, behavior: 'smooth' });
	}

	function applyTocState(isOpen) {
		const card = $('#article-toc');
		const toggle = $('#toc-toggle');
		if (card) {
			card.dataset.state = isOpen ? 'open' : 'closed';
			card.setAttribute('aria-expanded', String(isOpen));
		}
		if (toggle) {
			toggle.hidden = false;
			toggle.setAttribute('aria-expanded', String(isOpen));
		}
	}

	function initTOC() {
		if (theme.articles?.toc?.enable !== true) return;
		const container = $('#article-toc');
		if (!container) {
			tocSections = [];
			return;
		}

		const navItems = container.querySelectorAll('.nav-item');
		if (navItems.length === 0) {
			$('#toc-toggle')?.remove();
			container.remove();
			return;
		}

		tocSections = [...container.querySelectorAll('a.nav-link')].map((element) =>
			document.getElementById(decodeURI(element.getAttribute('href')).replace('#', '')),
		);
		updateActiveTOCLink();

		const stored = getStyleStatus();
		if (stored && typeof stored.isOpenPageAside === 'boolean') {
			applyTocState(stored.isOpenPageAside);
		} else {
			applyTocState(false);
		}
	}

	let tocToggleInitialized = false;
	function initTocToggleButton() {
		if (tocToggleInitialized) return;
		tocToggleInitialized = true;
		// 事件委托：swup 切换页面后按钮元素会被替换
		document.addEventListener('click', (event) => {
			if (!event.target.closest('#toc-toggle')) return;
			const card = $('#article-toc');
			if (!card) return;
			const isOpen = card.dataset.state !== 'open';
			updateStyleStatus({ isOpenPageAside: isOpen });
			applyTocState(isOpen);
		});
	}

	/* ---------------------------------------------------------- */
	/* Jump to comments                                            */
	/* ---------------------------------------------------------- */

	let goCommentInitialized = false;
	function initGoComment() {
		if (goCommentInitialized) return;
		goCommentInitialized = true;
		// 事件委托：swup 切换页面后按钮元素会被替换
		document.addEventListener('click', (event) => {
			if (!event.target.closest('#comment-jump')) return;
			const target = $('#comments');
			if (!target) return;
			const offset = target.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({ top: offset, behavior: 'smooth' });
		});
	}

	/* ---------------------------------------------------------- */
	/* Footer runtime counter                                      */
	/* ---------------------------------------------------------- */

	let runtimeInterval = null;
	function initFooterRuntime() {
		if (runtimeInterval) window.clearInterval(runtimeInterval);
		if (theme.footer?.runtime !== true) return;
		const startTime = theme.footerStart;
		if (!startTime) return;

		const tick = () => {
			const startDate = new Date(startTime);
			const nowDate = new Date();
			const diff = nowDate.getTime() - startDate.getTime();
			const dayMs = 24 * 60 * 60 * 1000;
			const daysFloat = diff / dayMs;
			const days = Math.floor(daysFloat);
			const hoursFloat = (daysFloat - days) * 24;
			const hours = Math.floor(hoursFloat);
			const minutesFloat = (hoursFloat - hours) * 60;
			const minutes = Math.floor(minutesFloat);
			const seconds = Math.floor((minutesFloat - minutes) * 60);

			const setValue = (id, value) => {
				const el = document.getElementById(id);
				if (el) el.innerHTML = String(value);
			};
			setValue('runtime_days', days);
			setValue('runtime_hours', hours);
			setValue('runtime_minutes', minutes);
			setValue('runtime_seconds', seconds);
			setValue('sidebar-runtime-days', days);
		};

		tick();
		runtimeInterval = window.setInterval(tick, 1000);
	}

	/* ---------------------------------------------------------- */
	/* Code blocks: copy + fold buttons                            */
	/* ---------------------------------------------------------- */

	function initCopyCode() {
		if (theme.articles?.code_block?.copy !== true) return;
		$$('.code-container').forEach((container) => {
			if (container.dataset.codeBlockReady) return;
			container.dataset.codeBlockReady = 'true';

			const pre = container.querySelector('pre');
			if (!pre) return;

			const wrapper = document.createElement('div');
			wrapper.classList.add('highlight-container');
			pre.parentNode.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);

			const copyButton = document.createElement('button');
			copyButton.type = 'button';
			copyButton.className = 'copy-button';
			copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
			copyButton.setAttribute('aria-label', 'Copy code');
			wrapper.appendChild(copyButton);

			const foldButton = document.createElement('button');
			foldButton.type = 'button';
			foldButton.className = 'fold-button';
			foldButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
			foldButton.setAttribute('aria-label', 'Fold code');
			wrapper.appendChild(foldButton);

			copyButton.addEventListener('click', () => {
				const codeLines = [...wrapper.querySelectorAll('.line')];
				const code = codeLines.map((line) => line.innerText).join('\n');
				if (navigator.clipboard?.writeText) {
					navigator.clipboard.writeText(code);
				}
				copyButton.querySelector('i').className = 'fa-regular fa-check';
				setTimeout(() => {
					copyButton.querySelector('i').className = 'fa-regular fa-copy';
				}, 1000);
			});

			foldButton.addEventListener('click', () => {
				wrapper.classList.toggle('folded');
				foldButton.querySelector('i').className = wrapper.classList.contains('folded')
					? 'fa-solid fa-chevron-up'
					: 'fa-solid fa-chevron-down';
			});
		});
	}

	/* ---------------------------------------------------------- */
	/* Category list toggle                                        */
	/* ---------------------------------------------------------- */

	let categoryListInitialized = false;
	function initCategoryList() {
		if (categoryListInitialized) return;
		categoryListInitialized = true;
		document.addEventListener('click', (event) => {
			const toggle = event.target.closest('[data-category-toggle]');
			if (!toggle) return;
			const target = document.getElementById(toggle.getAttribute('aria-controls'));
			if (!target) return;
			const isVisible = !target.hidden;
			toggle.setAttribute('aria-expanded', String(!isVisible));
			target.hidden = isVisible;
		});
	}

	/* ---------------------------------------------------------- */
	/* Tabs                                                        */
	/* ---------------------------------------------------------- */

	let tabsInitialized = false;
	function initTabs() {
		if (tabsInitialized) return;
		tabsInitialized = true;

		const activateTab = (tab) => {
			const tabs = tab.closest('[data-tabs]');
			const tablist = tab.closest('[role="tablist"]');
			const panelId = tab.getAttribute('aria-controls');
			const panel = panelId ? document.getElementById(panelId) : null;
			if (!tabs || !tablist || !panel || !tabs.contains(panel)) return;
			tablist.querySelectorAll('[role="tab"]').forEach((item) => {
				const selected = item === tab;
				item.setAttribute('aria-selected', String(selected));
				item.tabIndex = selected ? 0 : -1;
			});
			tabs.querySelectorAll('[role="tabpanel"]').forEach((item) => {
				item.hidden = item !== panel;
			});
		};

		document.addEventListener('click', (event) => {
			const tab = event.target.closest('[data-tabs] [role="tab"][aria-controls]');
			if (!tab) return;
			event.stopPropagation();
			activateTab(tab);
		});

		document.addEventListener('keydown', (event) => {
			const tab = event.target.closest('[data-tabs] [role="tab"][aria-controls]');
			if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
			const tabs = [...tab.closest('[role="tablist"]')?.querySelectorAll('[role="tab"]') || []];
			const index = tabs.indexOf(tab);
			if (index === -1) return;
			event.preventDefault();
			const nextIndex =
				event.key === 'Home'
					? 0
					: event.key === 'End'
						? tabs.length - 1
						: event.key === 'ArrowRight'
							? (index + 1) % tabs.length
							: (index - 1 + tabs.length) % tabs.length;
			tabs[nextIndex].focus();
			activateTab(tabs[nextIndex]);
		});
	}

	/* ---------------------------------------------------------- */
	/* Local search                                                */
	/* ---------------------------------------------------------- */

	let isFetched = false;
	let cachedData = [];
	let searchPath = theme.navbar?.search?.path || '/search.json';

	function fetchSearchData() {
		if (isFetched || !searchPath) return;
		fetch(searchPath)
			.then((response) => response.text())
			.then((res) => {
				isFetched = true;
				cachedData = JSON.parse(res)
					.filter((data) => data.title)
					.map((data) => ({
						title: String(data.title).trim(),
						content: data.content ? String(data.content).trim().replace(/<[^>]+>/g, '') : '',
						url: decodeURIComponent(String(data.url)).replace(/\/{2,}/g, '/'),
					}));
				const status = $('#local-search-status');
				if (status) {
					status.innerHTML = '<i class="fa-solid fa-magnifying-glass fa-5x"></i>';
				}
			})
			.catch((error) => {
				console.error('Failed to load search data:', error);
			});
	}

	/* Shared scroll lock (search dialog + image viewer may overlap). */
	let scrollLockCount = 0;
	function lockScroll() {
		if (scrollLockCount === 0) {
			document.body.style.overflow = 'hidden';
		}
		scrollLockCount += 1;
	}
	function unlockScroll() {
		scrollLockCount = Math.max(0, scrollLockCount - 1);
		if (scrollLockCount === 0) {
			document.body.style.overflow = '';
		}
	}

	function closeSearchPopup() {
		const dialog = $('#local-search');
		if (!dialog) return;
		if (dialog.open) dialog.close();
	}

	function openSearchPopup() {
		const dialog = $('#local-search');
		const input = $('#local-search-input');
		if (!dialog || !input) return;
		if (!dialog.open) {
			dialog.showModal();
			lockScroll();
		}
		setTimeout(() => input.focus(), 300);
		if (!isFetched) fetchSearchData();
	}

	const getIndexByWord = (word, text, caseSensitive) => {
		const wordLen = word.length;
		if (wordLen === 0) return [];
		let startPosition = 0;
		let position = [];
		const index = [];
		if (!caseSensitive) {
			text = text.toLowerCase();
			word = word.toLowerCase();
		}
		while ((position = text.indexOf(word, startPosition)) > -1) {
			index.push({ position, word });
			startPosition = position + wordLen;
		}
		return index;
	};

	const mergeIntoSlice = (start, end, index, searchText) => {
		let currentItem = index[index.length - 1];
		let { position, word } = currentItem;
		const hits = [];
		let searchTextCountInSlice = 0;

		while (position + word.length <= end && index.length !== 0) {
			if (word === searchText) {
				searchTextCountInSlice++;
			}
			hits.push({ position, length: word.length });

			const wordEnd = position + word.length;
			index.pop();
			for (let i = index.length - 1; i >= 0; i--) {
				currentItem = index[i];
				position = currentItem.position;
				word = currentItem.word;
				if (wordEnd <= position) break;
				index.pop();
			}
		}
		return { hits, start, end, searchTextCount: searchTextCountInSlice };
	};

	const highlightKeyword = (text, slice) => {
		let result = '';
		let prevEnd = slice.start;
		slice.hits.forEach((hit) => {
			result += text.substring(prevEnd, hit.position);
			const end = hit.position + hit.length;
			result += `<b class="border-b border-dashed border-primary font-bold text-primary">${text.substring(hit.position, end)}</b>`;
			prevEnd = end;
		});
		result += text.substring(prevEnd, slice.end);
		return result;
	};

	function renderSearchResult(input) {
		if (!isFetched || !input) return;
		const resultContent = $('#local-search-results');
		if (!resultContent) return;

		const searchText = input.value.trim().toLowerCase();
		const keywords = searchText.split(/[-\s]+/);
		if (keywords.length > 1) keywords.push(searchText);
		const resultItems = [];

		if (searchText.length > 0) {
			cachedData.forEach(({ title, content, url }) => {
				const titleInLowerCase = title.toLowerCase();
				const contentInLowerCase = content.toLowerCase();
				let indexOfTitle = [];
				let indexOfContent = [];
				let searchTextCount = 0;

				keywords.forEach((keyword) => {
					indexOfTitle = indexOfTitle.concat(getIndexByWord(keyword, titleInLowerCase, false));
					indexOfContent = indexOfContent.concat(getIndexByWord(keyword, contentInLowerCase, false));
				});

				if (indexOfTitle.length > 0 || indexOfContent.length > 0) {
					const hitCount = indexOfTitle.length + indexOfContent.length;
					[indexOfTitle, indexOfContent].forEach((index) => {
						index.sort((a, b) => {
							if (b.position !== a.position) return b.position - a.position;
							return a.word.length - b.word.length;
						});
					});

					const slicesOfTitle = [];
					if (indexOfTitle.length !== 0) {
						const tmp = mergeIntoSlice(0, title.length, indexOfTitle, searchText);
						searchTextCount += tmp.searchTextCountInSlice;
						slicesOfTitle.push(tmp);
					}

					let slicesOfContent = [];
					while (indexOfContent.length !== 0) {
						const item = indexOfContent[indexOfContent.length - 1];
						const { position, word } = item;
						let start = position - 20;
						let end = position + 80;
						if (start < 0) start = 0;
						if (end < position + word.length) end = position + word.length;
						if (end > content.length) end = content.length;
						const tmp = mergeIntoSlice(start, end, indexOfContent, searchText);
						searchTextCount += tmp.searchTextCountInSlice;
						slicesOfContent.push(tmp);
					}

					slicesOfContent.sort((a, b) => {
						if (a.searchTextCount !== b.searchTextCount) return b.searchTextCount - a.searchTextCount;
						if (a.hits.length !== b.hits.length) return b.hits.length - a.hits.length;
						return a.start - b.start;
					});

					const upperBound = parseInt(theme.navbar.search.top_n_per_article ?? '1', 10);
					if (upperBound >= 0) slicesOfContent = slicesOfContent.slice(0, upperBound);

					let resultItem = '';
					if (slicesOfTitle.length !== 0) {
						resultItem += `<li class="my-2.5 box-border border-b border-dashed border-rd-gray-alpha-400 py-2.5 last:border-b-0"><a href="${url}" class="mb-2.5 flex items-center font-bold"><span class="mr-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-rd-gray-1000" aria-hidden="true"></span>${highlightKeyword(title, slicesOfTitle[0])}</a>`;
					} else {
						resultItem += `<li class="my-2.5 box-border border-b border-dashed border-rd-gray-alpha-400 py-2.5 last:border-b-0"><a href="${url}" class="mb-2.5 flex items-center font-bold"><span class="mr-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-rd-gray-1000" aria-hidden="true"></span>${title}</a>`;
					}

					slicesOfContent.forEach((slice) => {
						resultItem += `<a href="${url}" class="hover:text-rd-gray-1000"><p class="m-0 pl-4 leading-8 [overflow-wrap:break-word]">${highlightKeyword(content, slice)}...</p></a>`;
					});

					resultItem += '</li>';
					resultItems.push({ item: resultItem, hitCount, searchTextCount });
				}
			});
		}

		if (keywords.length === 1 && keywords[0] === '') {
			resultContent.innerHTML = '<div id="local-search-status" class="m-auto text-rd-gray-900" aria-live="polite"><i class="fa-solid fa-magnifying-glass fa-5x" aria-hidden="true"></i></div>';
		} else if (resultItems.length === 0) {
			resultContent.innerHTML = '<div id="local-search-status" class="m-auto text-rd-gray-900" aria-live="polite"><i class="fa-solid fa-box-open fa-5x" aria-hidden="true"></i></div>';
		} else {
			resultItems.sort((a, b) => {
				if (a.searchTextCount !== b.searchTextCount) return b.searchTextCount - a.searchTextCount;
				if (a.hitCount !== b.hitCount) return b.hitCount - a.hitCount;
				return 0;
			});
			let searchResultList = '<ul class="h-full w-full text-base">';
			resultItems.forEach((result) => {
				searchResultList += result.item;
			});
			searchResultList += '</ul>';
			resultContent.innerHTML = searchResultList;
		}
	}

	let searchInitialized = false;
	function initLocalSearch() {
		if (theme.navbar?.search?.enable !== true) return;
		// The dialog element is replaced on every swup navigation; bind the scroll
		// unlock to its native `close` event so Escape-cancel also unlocks (the
		// browser closes <dialog> on Escape before keyup handlers run).
		const searchDialog = $('#local-search');
		if (searchDialog && !searchDialog.dataset.closeScrollBound) {
			searchDialog.dataset.closeScrollBound = 'true';
			searchDialog.addEventListener('close', () => unlockScroll());
		}
		if (!searchInitialized) {
			searchInitialized = true;
			document.addEventListener('input', (event) => {
				if (event.target.matches('#local-search-input')) {
					renderSearchResult(event.target);
				}
			});
			document.addEventListener('click', (event) => {
				if (event.target.closest('[data-search-trigger]')) {
					openSearchPopup();
					return;
				}
				const dialog = event.target.closest('#local-search');
				if (dialog && event.target === dialog) {
					closeSearchPopup();
					return;
				}
				if (event.target.closest('[data-search-action="clear"]')) {
					const input = $('#local-search-input');
					if (input) {
						input.value = '';
						input.focus();
						renderSearchResult(input);
					}
					return;
				}
				if (event.target.closest('[data-search-action="close"]')) {
					closeSearchPopup();
				}
			});
		}
		closeSearchPopup();
		if (theme.navbar?.search?.preload) fetchSearchData();
	}

	/* ---------------------------------------------------------- */
	/* Image viewer                                                */
	/* ---------------------------------------------------------- */

	const viewerState = {
		isBigImage: false,
		scale: 1,
		fitScale: 1,
		userZoomed: false,
		isMouseDown: false,
		dragged: false,
		currentImgIndex: 0,
		lastMouseX: 0,
		lastMouseY: 0,
		translateX: 0,
		translateY: 0,
		maskDom: null,
		targetImg: null,
	};

	const imageSelector = '.markdown-body img:not([data-image-viewer="ignore"]), [data-masonry-item] img:not([data-image-viewer="ignore"]), .essay img:not([data-image-viewer="ignore"])';

	let imageNodes = [];
	let viewerKeysInitialized = false;
	const exifControls = { requestId: 0 };

	const applyTransform = () => {
		if (!viewerState.targetImg) return;
		viewerState.targetImg.style.transform = `translate(${viewerState.translateX}px, ${viewerState.translateY}px) scale(${viewerState.scale})`;
	};

	const getFrameRect = () => {
		if (!viewerState.maskDom) return null;
		const frame = viewerState.maskDom.querySelector('[data-viewer-frame]');
		return frame ? frame.getBoundingClientRect() : viewerState.maskDom.getBoundingClientRect();
	};

	const fitToViewport = (options = {}) => {
		if (!viewerState.targetImg) return;
		const rect = getFrameRect();
		if (!rect) return;
		const marginFactor = options.marginFactor ?? 0.98;
		viewerState.scale = 1;
		viewerState.translateX = 0;
		viewerState.translateY = 0;
		applyTransform();

		const imageRect = viewerState.targetImg.getBoundingClientRect();
		if (!imageRect.width || !imageRect.height) return;
		const heightLimit = window.innerHeight * marginFactor;
		const widthLimit = window.innerWidth;
		const scaleForHeight = heightLimit / imageRect.height;
		const scaleForWidth = widthLimit / imageRect.width;
		const fitScale = Math.min(1, scaleForHeight, scaleForWidth);
		viewerState.fitScale = fitScale;
		viewerState.scale = fitScale;
		viewerState.userZoomed = false;
		applyTransform();
	};

	const resetTransform = () => fitToViewport();

	const showViewerHandle = (isShow) => {
		if (!viewerState.maskDom) return;
		if (isShow && !viewerState.maskDom.open) {
			viewerState.maskDom.showModal();
			lockScroll();
		} else if (!isShow && viewerState.maskDom.open) {
			viewerState.maskDom.close();
			unlockScroll();
		}
	};

	const resetExifUI = () => {
		exifControls.requestId = (exifControls.requestId || 0) + 1;
		const toggleButton = $('#image-viewer-exif-toggle');
		const panel = $('#image-viewer-exif');
		if (toggleButton) {
			toggleButton.hidden = true;
			toggleButton.setAttribute('aria-expanded', 'false');
		}
		if (panel) {
			panel.hidden = true;
			panel.setAttribute('aria-hidden', 'true');
		}
		const cards = $('#image-viewer-exif-cards');
		if (cards) cards.innerHTML = '';
	};

	const closeViewer = () => {
		if (!viewerState.isBigImage) return;
		viewerState.isBigImage = false;
		showViewerHandle(false);
		resetTransform();
		viewerState.userZoomed = false;
		resetExifUI();
	};

	const updateImageNodes = () => {
		imageNodes = $$(imageSelector);
	};

	const canGoPrev = () => viewerState.currentImgIndex > 0;
	const canGoNext = () => viewerState.currentImgIndex < Math.max(imageNodes.length - 1, 0);

	const updateNavButtons = () => {
		const prevButton = viewerState.maskDom?.querySelector('[data-viewer-action="previous"]');
		const nextButton = viewerState.maskDom?.querySelector('[data-viewer-action="next"]');
		if (prevButton) prevButton.disabled = !canGoPrev();
		if (nextButton) nextButton.disabled = !canGoNext();
	};

	const setExifPanelOpen = (isOpen) => {
		const panel = $('#image-viewer-exif');
		const toggleButton = $('#image-viewer-exif-toggle');
		if (!panel || !toggleButton) return;
		panel.hidden = !isOpen;
		panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
		toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
	};

	const formatExifValue = (tag) => {
		if (!tag) return null;
		if (typeof tag === 'object') {
			if (tag.description != null) return String(tag.description).trim();
			if (tag.value != null) {
				if (Array.isArray(tag.value)) return tag.value.map((item) => String(item)).join(', ').trim();
				return String(tag.value).trim();
			}
		}
		return String(tag).trim();
	};

	const getExifValueByKeys = (tags, keys = []) => {
		if (!tags) return null;
		for (const key of keys) {
			const value = formatExifValue(tags[key]);
			if (value) return value;
		}
		return null;
	};

	const parseRational = (value) => {
		if (typeof value === 'number') return Number.isFinite(value) ? value : null;
		if (value && typeof value === 'object') {
			const numerator = value.numerator ?? value.num;
			const denominator = value.denominator ?? value.den;
			if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) return numerator / denominator;
			if (Number.isFinite(value.value)) return value.value;
		}
		if (typeof value === 'string') {
			const parsed = Number.parseFloat(value);
			return Number.isFinite(parsed) ? parsed : null;
		}
		return null;
	};

	const resolveTagRawValue = (tag) => (tag && typeof tag === 'object' && 'value' in tag ? tag.value : tag);

	const formatGpsCoordinate = (tags, valueKey, refKey) => {
		if (!tags) return null;
		const rawTag = tags[valueKey];
		if (!rawTag) return null;
		const rawValue = resolveTagRawValue(rawTag);
		const ref = formatExifValue(tags[refKey]);
		let decimal = null;
		if (Array.isArray(rawValue)) {
			const parts = rawValue.map(parseRational).filter((part) => part != null);
			if (parts.length >= 3) {
				const [deg, min, sec] = parts;
				decimal = deg + min / 60 + sec / 3600;
			}
		} else {
			decimal = parseRational(rawValue);
		}
		if (decimal == null) {
			const fallback = formatExifValue(rawTag);
			if (!fallback) return null;
			if (ref && !fallback.includes(ref)) return `${fallback} ${ref}`;
			return fallback;
		}
		const normalizedRef = ref ? String(ref).trim().toUpperCase() : '';
		const displayValue = Math.abs(decimal).toFixed(4);
		return normalizedRef ? `${displayValue} ${normalizedRef}` : decimal.toFixed(4);
	};

	const buildExifGroups = (tags) => {
		if (!tags) return [];
		const groups = [];
		const pushGroup = (title, icon, items) => {
			const normalizedItems = (items || []).filter(Boolean);
			if (normalizedItems.length === 0) return;
			groups.push({ title, icon, items: normalizedItems });
		};
		const make = getExifValueByKeys(tags, ['Make']);
		const model = getExifValueByKeys(tags, ['Model']);
		const dateTaken = getExifValueByKeys(tags, ['DateTimeOriginal', 'DateTime']);
		pushGroup(t('exif.cards.camera', 'Camera'), 'fa-solid fa-camera', [
			make && { label: t('exif.fields.make', 'Brand'), value: make },
			model && { label: t('exif.fields.model', 'Model'), value: model },
			dateTaken && { label: t('exif.fields.date_taken', 'Date taken'), value: dateTaken },
		]);

		const lensModel = getExifValueByKeys(tags, ['LensModel', 'Lens', 'LensSpecification']);
		const focalLength = getExifValueByKeys(tags, ['FocalLength', 'FocalLengthIn35mmFilm']);
		const focusMode = getExifValueByKeys(tags, ['FocusMode', 'AFMode', 'AFAreaMode', 'FocusingMode', 'AutoFocus', 'FocusMethod']);
		pushGroup(t('exif.cards.lens', 'Lens'), 'fa-solid fa-eye', [
			lensModel && { label: t('exif.fields.lens_model', 'Lens'), value: lensModel },
			focalLength && { label: t('exif.fields.focal_length', 'Focal length'), value: focalLength },
			focusMode && { label: t('exif.fields.focus_mode', 'Focus mode'), value: focusMode },
		]);

		const shutter = getExifValueByKeys(tags, ['ExposureTime']);
		const aperture = getExifValueByKeys(tags, ['FNumber']);
		const iso = getExifValueByKeys(tags, ['ISO', 'PhotographicSensitivity']);
		const exposureProgram = getExifValueByKeys(tags, ['ExposureProgram']);
		const exposureCompensation = getExifValueByKeys(tags, ['ExposureBiasValue']);
		const meteringMode = getExifValueByKeys(tags, ['MeteringMode']);
		pushGroup(t('exif.cards.exposure', 'Exposure'), 'fa-solid fa-sun', [
			shutter && { label: t('exif.fields.shutter', 'Shutter'), value: shutter },
			aperture && { label: t('exif.fields.aperture', 'Aperture'), value: aperture },
			iso && { label: t('exif.fields.iso', 'ISO'), value: iso },
			exposureProgram && { label: t('exif.fields.exposure_program', 'Exposure program'), value: exposureProgram },
			exposureCompensation && { label: t('exif.fields.exposure_compensation', 'Exposure compensation'), value: exposureCompensation },
			meteringMode && { label: t('exif.fields.metering_mode', 'Metering mode'), value: meteringMode },
		]);

		const flash = getExifValueByKeys(tags, ['Flash']);
		const whiteBalance = getExifValueByKeys(tags, ['WhiteBalance']);
		const latitude = formatGpsCoordinate(tags, 'GPSLatitude', 'GPSLatitudeRef');
		const longitude = formatGpsCoordinate(tags, 'GPSLongitude', 'GPSLongitudeRef');
		const altitude = getExifValueByKeys(tags, ['GPSAltitude']);
		pushGroup(t('exif.cards.other', 'Other'), 'fa-solid fa-gear', [
			flash && { label: t('exif.fields.flash', 'Flash'), value: flash },
			whiteBalance && { label: t('exif.fields.white_balance', 'White balance'), value: whiteBalance },
			latitude && { label: t('exif.fields.latitude', 'Latitude'), value: latitude },
			longitude && { label: t('exif.fields.longitude', 'Longitude'), value: longitude },
			altitude && { label: t('exif.fields.altitude', 'Altitude'), value: altitude },
		]);
		return groups;
	};

	const renderExifMessage = (message) => {
		const cards = $('#image-viewer-exif-cards');
		if (!cards) return;
		cards.innerHTML = '';
		const title = t('exif.title', 'EXIF');
		const card = document.createElement('div');
		card.className = 'rounded-lg bg-rd-background-100/40 px-3 py-2';
		card.innerHTML = `<div class="mb-1 flex items-center gap-2"><i class="fa-solid fa-circle-info text-xs text-rd-gray-900"></i><div class="text-xs font-semibold text-rd-gray-1000">${title}</div></div><div class="flex flex-col gap-1"><div class="flex items-start justify-between gap-2"><div class="shrink-0 text-[0.65rem] tracking-wide text-rd-gray-900 uppercase">${title}</div><div class="text-right text-[0.65rem] text-rd-gray-1000">${message}</div></div></div>`;
		cards.appendChild(card);
	};

	const loadExifForImage = async (img) => {
		exifControls.requestId = (exifControls.requestId || 0) + 1;
		const requestId = exifControls.requestId;
		renderExifMessage(t('exif.status.loading', 'Loading...'));

		const ExifReader = window.ExifReader;
		if (!ExifReader || typeof ExifReader.load !== 'function') {
			if (exifControls.requestId !== requestId) return;
			renderExifMessage(t('exif.status.library_missing', 'EXIF library not loaded'));
			return;
		}

		const dataSrc = img.dataset.lazySrc;
		const url = new URL(dataSrc || img.currentSrc || img.src, window.location.href).toString();
		try {
			const tags = await ExifReader.load(url);
			if (exifControls.requestId !== requestId) return;
			const groups = buildExifGroups(tags);
			if (groups.length === 0) {
				renderExifMessage(t('exif.status.no_exif', 'No EXIF available'));
				return;
			}
			const cards = $('#image-viewer-exif-cards');
			if (!cards) return;
			cards.innerHTML = '';
			groups.forEach((group) => {
				const card = document.createElement('div');
				card.className = 'rounded-lg bg-rd-background-100/40 px-3 py-2';
				card.innerHTML = `<div class="mb-1 flex items-center gap-2"><i class="${group.icon} text-xs text-rd-gray-900"></i><div class="text-xs font-semibold text-rd-gray-1000">${group.title}</div></div><div class="flex flex-col gap-1">${group.items
					.map((item) => `<div class="flex items-start justify-between gap-2"><div class="shrink-0 text-[0.65rem] tracking-wide text-rd-gray-900 uppercase">${item.label}</div><div class="text-right text-[0.65rem] text-rd-gray-1000">${item.value}</div></div>`)
					.join('')}</div>`;
				cards.appendChild(card);
			});
		} catch {
			if (exifControls.requestId !== requestId) return;
			renderExifMessage(t('exif.status.unavailable', 'EXIF unavailable (blocked by CORS or missing metadata)'));
		}
	};

	const hasExifFlag = (img) => img?.dataset?.exif === 'true';

	const updateExifUI = (img) => {
		exifControls.requestId = (exifControls.requestId || 0) + 1;
		const toggleButton = $('#image-viewer-exif-toggle');
		if (toggleButton) {
			toggleButton.hidden = !hasExifFlag(img);
			toggleButton.disabled = !hasExifFlag(img);
		}
		setExifPanelOpen(false);
		const cards = $('#image-viewer-exif-cards');
		if (cards) cards.innerHTML = '';
	};

	const updateViewerImage = (index) => {
		const currentImg = imageNodes[index];
		if (!currentImg || !viewerState.targetImg) return;
		viewerState.currentImgIndex = index;

		let newSrc = currentImg.src;
		if (currentImg.dataset.lazyState === 'pending') {
			newSrc = currentImg.dataset.lazySrc || newSrc;
			if (newSrc) currentImg.src = newSrc;
			currentImg.dataset.lazyState = 'loaded';
		}

		if (newSrc) viewerState.targetImg.src = newSrc;
		viewerState.targetImg.alt = currentImg.alt || '';

		const handleImageLoad = () => {
			viewerState.targetImg?.removeEventListener('load', handleImageLoad);
			fitToViewport();
		};
		if (viewerState.targetImg.complete) fitToViewport();
		else viewerState.targetImg.addEventListener('load', handleImageLoad, { once: true });

		updateNavButtons();
		updateExifUI(currentImg);
	};

	const goPrev = () => {
		if (!viewerState.isBigImage || !canGoPrev()) return;
		updateViewerImage(viewerState.currentImgIndex - 1);
	};

	const goNext = () => {
		if (!viewerState.isBigImage || !canGoNext()) return;
		updateViewerImage(viewerState.currentImgIndex + 1);
	};

	const handleArrowKeys = (event) => {
		if (!viewerState.isBigImage) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeViewer();
			return;
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
			event.preventDefault();
			goPrev();
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		}
	};

	let pendingDragX = null;
	let pendingDragY = null;
	let dragRafId = null;

	function initImageViewer() {
		const maskDom = $('#image-viewer');
		const targetImg = $('#image-viewer-image');
		if (!maskDom || !targetImg) return;

		viewerState.maskDom = maskDom;
		viewerState.targetImg = targetImg;
		viewerState.dragged = false;

		updateImageNodes();
		updateNavButtons();
		resetExifUI();

		if (!viewerKeysInitialized) {
			viewerKeysInitialized = true;
			document.addEventListener('keydown', handleArrowKeys);
			document.addEventListener('click', (event) => {
				const img = event.target.closest(imageSelector);
				if (!img || img.closest('#image-viewer')) return;
				updateImageNodes();
				const index = imageNodes.indexOf(img);
				viewerState.isBigImage = true;
				viewerState.dragged = false;
				viewerState.userZoomed = false;
				showViewerHandle(true);
				updateViewerImage(index === -1 ? 0 : index);
			});
		}

		targetImg.addEventListener('wheel', (event) => {
			if (!event.ctrlKey) return;
			event.preventDefault();
			if (!viewerState.targetImg) return;
			const rect = viewerState.targetImg.getBoundingClientRect();
			const offsetX = event.clientX - rect.left;
			const offsetY = event.clientY - rect.top;
			const dx = offsetX - rect.width / 2;
			const dy = offsetY - rect.height / 2;
			const oldScale = viewerState.scale;
			const minScale = Math.max(0.2, viewerState.fitScale * 0.8);
			const maxScale = Math.min(8, viewerState.fitScale * 4);
			viewerState.scale += event.deltaY * -0.001;
			viewerState.scale = Math.min(Math.max(minScale, viewerState.scale), maxScale);
			viewerState.userZoomed = Math.abs(viewerState.scale - viewerState.fitScale) > 0.01;
			if (oldScale < viewerState.scale) {
				viewerState.translateX -= dx * (viewerState.scale - oldScale);
				viewerState.translateY -= dy * (viewerState.scale - oldScale);
			} else {
				viewerState.translateX = 0;
				viewerState.translateY = 0;
			}
			applyTransform();
		}, { passive: false });

		targetImg.addEventListener('mousedown', (event) => {
			if (viewerState.scale <= viewerState.fitScale + 0.01) return;
			event.preventDefault();
			viewerState.isMouseDown = true;
			viewerState.lastMouseX = event.clientX;
			viewerState.lastMouseY = event.clientY;
			pendingDragX = event.clientX;
			pendingDragY = event.clientY;
			viewerState.targetImg.style.cursor = 'grabbing';
			viewerState.userZoomed = true;
		});

		targetImg.addEventListener('mousemove', (event) => {
			if (!viewerState.isMouseDown || viewerState.scale <= viewerState.fitScale + 0.01) return;
			pendingDragX = event.clientX;
			pendingDragY = event.clientY;
			if (dragRafId !== null) return;
			dragRafId = window.requestAnimationFrame(() => {
				if (pendingDragX == null || pendingDragY == null) {
					dragRafId = null;
					return;
				}
				const deltaX = pendingDragX - viewerState.lastMouseX;
				const deltaY = pendingDragY - viewerState.lastMouseY;
				viewerState.translateX += deltaX;
				viewerState.translateY += deltaY;
				viewerState.lastMouseX = pendingDragX;
				viewerState.lastMouseY = pendingDragY;
				applyTransform();
				viewerState.dragged = true;
				dragRafId = null;
			});
		});

		const dragEndHandle = (event) => {
			if (viewerState.isMouseDown) event.stopPropagation();
			viewerState.isMouseDown = false;
			if (dragRafId !== null) {
				window.cancelAnimationFrame(dragRafId);
				dragRafId = null;
			}
			pendingDragX = null;
			pendingDragY = null;
			if (viewerState.dragged) {
				window.setTimeout(() => {
					viewerState.dragged = false;
				}, 0);
			}
			if (viewerState.targetImg) viewerState.targetImg.style.cursor = 'grab';
		};

		targetImg.addEventListener('mouseup', dragEndHandle);
		targetImg.addEventListener('mouseleave', dragEndHandle);

		maskDom.addEventListener('click', (event) => {
			if (viewerState.dragged) return;
			const target = event.target;
			if (target.closest('[data-viewer-action], #image-viewer-exif')) return;
			if (target.closest('[data-viewer-frame] img')) return;
			const frame = maskDom.querySelector('[data-viewer-frame]');
			if (target === maskDom || (frame && target === frame)) closeViewer();
		});

		window.addEventListener('resize', () => {
			if (!viewerState.isBigImage || viewerState.userZoomed) return;
			fitToViewport();
		});

		maskDom.querySelector('[data-viewer-action="previous"]')?.addEventListener('click', (event) => {
			event.stopPropagation();
			goPrev();
		});
		maskDom.querySelector('[data-viewer-action="next"]')?.addEventListener('click', (event) => {
			event.stopPropagation();
			goNext();
		});
		maskDom.querySelector('[data-viewer-action="close"]')?.addEventListener('click', (event) => {
			event.stopPropagation();
			closeViewer();
		});
		$('#image-viewer-exif-toggle')?.addEventListener('click', (event) => {
			event.stopPropagation();
			const panel = $('#image-viewer-exif');
			if (!panel) return;
			const isOpen = !panel.hidden;
			if (isOpen) {
				setExifPanelOpen(false);
				return;
			}
			setExifPanelOpen(true);
			const currentImg = imageNodes[viewerState.currentImgIndex];
			if (!hasExifFlag(currentImg)) {
				renderExifMessage(t('exif.status.flag_unavailable', 'EXIF unavailable'));
				return;
			}
			loadExifForImage(currentImg);
		});
		maskDom.querySelector('[data-viewer-action="close-exif"]')?.addEventListener('click', (event) => {
			event.stopPropagation();
			setExifPanelOpen(false);
		});
	}

	/* ---------------------------------------------------------- */
	/* Expiration date                                             */
	/* ---------------------------------------------------------- */

	function initExpirationDate() {
		const container = $('#expiration-container');
		const value = $('#expiration-date');
		if (!container || !value) return;
		const expires = container.dataset.expires;
		const updated = container.dataset.updated;
		if (!expires || !updated) return;
		const expiredDate = new Date(expires);
		const updatedDate = new Date(updated);
		if (Number.isNaN(expiredDate.getTime()) || Number.isNaN(updatedDate.getTime())) return;
		const now = new Date();
		const daysAgo = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
		container.hidden = true;
		if (expiredDate < now) {
			container.hidden = false;
			value.innerHTML = value.innerHTML.replace('%s', daysAgo);
		}
	}

	/* ---------------------------------------------------------- */
	/* Lazyload                                                    */
	/* ---------------------------------------------------------- */

	let lazyloadObserver = null;

	function initLazyLoad() {
		if (theme.articles?.lazyload !== true) return;
		const apply = (img) => {
			const dataSrc = img.dataset.lazySrc;
			if (dataSrc) img.src = dataSrc;
			img.dataset.lazyState = 'loaded';
			delete img.dataset.redefineLazyloadObserved;
		};
		if (typeof IntersectionObserver === 'undefined') {
			$$('img[data-lazy-state="pending"]').forEach(apply);
			return;
		}
		if (!lazyloadObserver) {
			lazyloadObserver = new IntersectionObserver((entries, observer) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					apply(entry.target);
					observer.unobserve(entry.target);
				});
			}, { rootMargin: '0px', threshold: 0.1 });
		}
		$$('img[data-lazy-state="pending"]').forEach((img) => {
			if (img.dataset.redefineLazyloadObserved) return;
			img.dataset.redefineLazyloadObserved = 'true';
			lazyloadObserver.observe(img);
		});
	}

	/* ---------------------------------------------------------- */
	/* Pangu                                                       */
	/* ---------------------------------------------------------- */

	function initPangu() {
		if (theme.articles?.pangu_js !== true) return;
		if (typeof pangu === 'undefined' || !$('.markdown-body')) return;
		pangu.spacingElementByClassName('markdown-body');
	}

	/* ---------------------------------------------------------- */
	/* Mermaid                                                     */
	/* ---------------------------------------------------------- */

	function initMermaid() {
		if (theme.plugins?.mermaid?.enable !== true) return;
		if (typeof window.mermaid === 'undefined') return;
		const selector = '.mermaid';
		$$(selector).forEach((element) => {
			if (!element.getAttribute('data-original-code')) {
				element.setAttribute('data-original-code', element.innerHTML);
			}
			const originalCode = element.getAttribute('data-original-code');
			if (originalCode !== null) {
				element.removeAttribute('data-processed');
				element.innerHTML = originalCode;
			}
		});
		const mermaidTheme = styleStatus.isDark
			? theme.plugins.mermaid.theme?.dark || 'dark'
			: theme.plugins.mermaid.theme?.light || 'default';
		window.mermaid.initialize({ theme: mermaidTheme });
		window.mermaid.init({ theme: mermaidTheme }, $$(selector));
	}

	/* ---------------------------------------------------------- */
	/* Inline MetingJS player ({% audio %} tags)                   */
	/* ---------------------------------------------------------- */

	let metingLibsLoading = false;
	let metingLibsLoaded = false;

	function initInlineAudio() {
		const containers = $$('.aplayer-inline');
		if (!containers.length) return;
		if (metingLibsLoading || metingLibsLoaded) return;
		metingLibsLoading = true;

		const ensureScript = (src, callback) => {
			if (document.querySelector(`script[src="${src}"]`)) {
				callback();
				return;
			}
			const script = document.createElement('script');
			script.src = src;
			script.onload = callback;
			document.body.appendChild(script);
		};

		// MetingJS custom elements upgrade automatically once APlayer exists,
		// so APlayer must be loaded before Meting2.
		ensureScript('/scripts/APlayer.min.js', () => {
			ensureScript('/scripts/Meting2.min.js', () => {
				metingLibsLoaded = true;
			});
		});
	}

	/* ---------------------------------------------------------- */
	/* APlayer                                                     */
	/* ---------------------------------------------------------- */

	let aplayerInitialized = false;
	function initAPlayer() {
		const config = theme.plugins?.aplayer;
		if (config?.enable !== true || aplayerInitialized) return;
		if (typeof APlayer === 'undefined' || !$('#aplayer')) return;
		aplayerInitialized = true;

		const audioList = (config.audios || [])
			.filter((audio) => audio && audio.url)
			.map((audio) => ({
				name: audio.name,
				artist: audio.artist,
				url: audio.url,
				cover: audio.cover,
				lrc: audio.lrc,
				theme: audio.theme,
			}));

		if (config.type === 'mini') {
			new APlayer({ container: document.getElementById('aplayer'), mini: true, audio: audioList });
		} else {
			const player = new APlayer({ container: document.getElementById('aplayer'), fixed: true, lrcType: 3, audio: audioList });
			document.querySelector('.aplayer-icon-lrc')?.click();
		}
	}

	/* ---------------------------------------------------------- */
	/* Music play page (immersive, 参考 LuviciiBlog)               */
	/* ---------------------------------------------------------- */

	const escapeAttr = (value) =>
		String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

	let currentMusicPlayer = null;
	let musicBgObserver = null;
	let musicKeyHandler = null;

	/* 歌单数据由 play.astro 以 <script type="application/json"> 注入（含预计算的 url 字段） */
	const getMusicPlaylists = () => {
		const dataEl = document.getElementById('music-playlists-data');
		if (!dataEl) return [];
		try {
			const list = JSON.parse(dataEl.textContent || '[]');
			return Array.isArray(list) ? list : [];
		} catch {
			return [];
		}
	};

	const getMusicAplayer = () => document.querySelector('#music-player meting-js')?.aplayer;

	const updateMusicBg = () => {
		const bg = $('#music-bg');
		const pic = document.querySelector('#music-player .aplayer-pic');
		if (bg && pic) {
			const img = pic.style.backgroundImage;
			if (img && img !== 'none') bg.style.backgroundImage = img;
		}
	};

	/* 封面 style 变化（切歌）即同步模糊背景 */
	function observeMusicBg() {
		if (musicBgObserver) musicBgObserver.disconnect();
		const pic = document.querySelector('#music-player .aplayer-pic');
		if (!pic) return;
		musicBgObserver = new MutationObserver(() => updateMusicBg());
		musicBgObserver.observe(pic, { attributes: true, attributeFilter: ['style'] });
	}

	const showMusicError = () => {
		const el = $('#music-error');
		if (el) el.hidden = false;
	};

	const hideMusicError = () => {
		const el = $('#music-error');
		if (el) el.hidden = true;
	};

	/* 切歌时更新标题：歌名 - 歌手 · 音乐 */
	function updateMusicTitle(aplayer) {
		const audio = aplayer.list?.audios?.[aplayer.list.index];
		if (!audio?.name) return;
		const suffix = $('#music-player')?.dataset.titleSuffix || '';
		document.title = `${audio.name}${audio.artist ? ` - ${audio.artist}` : ''}${suffix ? ` · ${suffix}` : ''}`;
	}

	/* 记录最近播放（音乐一级页「继续播放」卡读取） */
	const writeMusicLastPlayed = (aplayer) => {
		const audio = aplayer.list?.audios?.[aplayer.list.index];
		if (!audio?.name) return;
		try {
			const params = new URLSearchParams(window.location.search);
			localStorage.setItem(
				'music-last-played',
				JSON.stringify({
					song: audio.name,
					artist: audio.artist || '',
					playlist: params.get('name') || $('#music-player')?.dataset.titleSuffix || t('music', '音乐'),
					url: window.location.href,
				}),
			);
		} catch {
			/* ignore */
		}
	};

	/* 移动端：menu 按钮切底部抽屉（撤掉 APlayer 原生的 list-hide 行为，以自己的 class 为准） */
	function bindMusicMenuToggle() {
		const menuBtn = document.querySelector('#music-player .aplayer-icon-menu');
		if (!menuBtn || menuBtn.dataset.wired) return;
		menuBtn.dataset.wired = 'true';
		menuBtn.addEventListener('click', () => {
			const list = document.querySelector('#music-player .aplayer-list');
			const mask = $('#menu-mask');
			if (!list) return;
			list.classList.remove('aplayer-list-hide');
			const open = list.classList.toggle('music-list-open');
			mask?.classList.toggle('show', open);
		});
	}

	/* 键盘控制：空格 toggle、←/→ 上下曲、↑/↓ 音量 ±0.1，仅在播放页绑定 */
	function bindMusicKeyboard() {
		if (musicKeyHandler) return;
		musicKeyHandler = (event) => {
			const aplayer = currentMusicPlayer;
			if (!aplayer) return;
			if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
			switch (event.code) {
				case 'Space':
					event.preventDefault();
					aplayer.toggle();
					break;
				case 'ArrowLeft':
					event.preventDefault();
					aplayer.skipBack();
					break;
				case 'ArrowRight':
					event.preventDefault();
					aplayer.skipForward();
					break;
				case 'ArrowUp':
					event.preventDefault();
					aplayer.volume(Math.min(1, aplayer.audio.volume + 0.1), true);
					break;
				case 'ArrowDown':
					event.preventDefault();
					aplayer.volume(Math.max(0, aplayer.audio.volume - 0.1), true);
					break;
			}
		};
		document.addEventListener('keydown', musicKeyHandler);
	}

	function destroyMusicPlayer() {
		if (musicBgObserver) {
			musicBgObserver.disconnect();
			musicBgObserver = null;
		}
		if (musicKeyHandler) {
			document.removeEventListener('keydown', musicKeyHandler);
			musicKeyHandler = null;
		}
		if (currentMusicPlayer) {
			try {
				currentMusicPlayer.destroy();
			} catch {
				/* 播放器 DOM 可能已随 swup 替换而移除 */
			}
			currentMusicPlayer = null;
		}
	}

	function bindMusicPlayer(element) {
		element.dataset.bindTries = '0';
		const tryBind = () => {
			if (!element.isConnected) return;
			element.dataset.bindTries = String(Number(element.dataset.bindTries || 0) + 1);
			const aplayer = element.aplayer;
			if (!aplayer) {
				if (Number(element.dataset.bindTries) < 24) setTimeout(tryBind, 250);
				else showMusicError();
				return;
			}
			hideMusicError();
			currentMusicPlayer = aplayer;
			aplayer.volume(0.8, true);
			aplayer.on('loadeddata', () => {
				updateMusicBg();
				updateMusicTitle(aplayer);
				writeMusicLastPlayed(aplayer);
			});
			aplayer.on('error', showMusicError);
			updateMusicBg();
			observeMusicBg();
			bindMusicMenuToggle();
			bindMusicKeyboard();
		};
		tryBind();
	}

	function initMusicPlay() {
		const mount = $('#music-player');
		if (!mount) return;
		const params = new URLSearchParams(window.location.search);
		const server = params.get('server') || 'netease';
		const type = params.get('type') || 'playlist';
		const id = params.get('id') || '';
		const cover = params.get('cover') || '';

		const bg = $('#music-bg');
		if (bg && cover && !bg.dataset.seeded) {
			bg.style.backgroundImage = `url("${escapeAttr(cover)}")`;
			bg.dataset.seeded = 'true';
		}

		if (!id || mount.dataset.musicId === `${server}:${type}:${id}`) return;
		mount.dataset.musicId = `${server}:${type}:${id}`;
		destroyMusicPlayer();
		hideMusicError();
		mount.innerHTML = '';
		const box = document.createElement('div');
		box.className = 'aplayer-inline';
		const player = document.createElement('meting-js');
		player.setAttribute('server', server);
		player.setAttribute('type', type);
		player.setAttribute('id', id);
		if (server === 'custom') {
			/* 自建直链歌单：每个歌单对应构建期生成的静态 Meting JSON（src/data/custom-music/<id>.json），不走公共解析 API */
			player.setAttribute('api', `/music/custom-songs/${encodeURIComponent(id)}.json`);
		}
		player.setAttribute('mutex', 'true');
		player.setAttribute('preload', 'auto');
		player.setAttribute('theme', 'var(--primary-color)');
		player.setAttribute('order', 'list');
		player.setAttribute('list-max-height', 'calc(70vh - 2rem)');
		box.appendChild(player);
		mount.appendChild(box);
		initInlineAudio();
		bindMusicPlayer(player);
	}

	/* 离开播放页时释放播放器、observer 与键盘监听（initPage 每次 page:view 都会调用） */
	function cleanupMusicPage() {
		if (window.location.pathname.startsWith('/music/play')) return;
		destroyMusicPlayer();
	}

	function rebuildMusicPlayer() {
		const mount = $('#music-player');
		if (!mount) return;
		delete mount.dataset.musicId;
		initMusicPlay();
	}

	function initMusicTools() {
		const switchBtn = $('#music-switch');
		const randomBtn = $('#music-random');
		const refreshBtn = $('#music-refresh');
		const retryBtn = $('#music-retry');
		const mask = $('#menu-mask');
		if (!switchBtn && !randomBtn && !refreshBtn) return;

		if (!switchBtn?.dataset.wired) {
			switchBtn?.setAttribute('data-wired', 'true');
			switchBtn?.addEventListener('click', () => {
				const list = getMusicPlaylists();
				if (list.length < 2) return;
				const current = new URLSearchParams(window.location.search).get('id');
				const index = list.findIndex((item) => String(item.id) === String(current));
				const next = list[(index + 1) % list.length];
				if (!next?.url) return;
				if (window.swup && typeof window.swup.loadPage === 'function') window.swup.loadPage({ url: next.url });
				else window.location.href = next.url;
			});
		}

		if (!randomBtn?.dataset.wired) {
			randomBtn?.setAttribute('data-wired', 'true');
			randomBtn?.addEventListener('click', () => {
				const aplayer = getMusicAplayer();
				if (!aplayer || !aplayer.list?.audios?.length) return;
				const index = Math.floor(Math.random() * aplayer.list.audios.length);
				aplayer.list.switch(index);
			});
		}

		if (!refreshBtn?.dataset.wired) {
			refreshBtn?.setAttribute('data-wired', 'true');
			refreshBtn?.addEventListener('click', rebuildMusicPlayer);
		}

		if (retryBtn && !retryBtn.dataset.wired) {
			retryBtn.dataset.wired = 'true';
			retryBtn.addEventListener('click', () => {
				hideMusicError();
				rebuildMusicPlayer();
			});
		}

		if (mask && !mask.dataset.wired) {
			mask.dataset.wired = 'true';
			mask.addEventListener('click', () => {
				document.querySelector('#music-player .aplayer-list')?.classList.remove('music-list-open');
				mask.classList.remove('show');
			});
		}
	}

	/* ---------------------------------------------------------- */
	/* Essays dates                                                */
	/* ---------------------------------------------------------- */

	function initEssays() {
		const dateElements = $$('[data-essay-date]');
		if (!dateElements.length || typeof moment === 'undefined') return;
		dateElements.forEach((element) => {
			const rawDate = element.getAttribute('datetime') || element.getAttribute('data-date');
			if (!rawDate) return;
			const locale = theme.language || 'zh-CN';
			const formattedDate = moment(rawDate).locale(locale).calendar();
			element.textContent = formattedDate;
		});
	}

	/* ---------------------------------------------------------- */
	/* Bookmark navigation                                         */
	/* ---------------------------------------------------------- */

	let bookmarkNavItems = [];
	let bookmarkSections = [];

	function setActiveBookmarkNav() {
		if (!bookmarkNavItems.length || !bookmarkSections.length) return;
		const fromTop = window.scrollY + 100;
		let currentSection = bookmarkSections[0];
		bookmarkSections.forEach((section) => {
			if (fromTop >= section.offsetTop && fromTop < section.offsetTop + section.offsetHeight) {
				currentSection = section;
			}
		});
		bookmarkNavItems.forEach((item) => {
			if (item.getAttribute('aria-controls') === currentSection?.id) {
				item.setAttribute('aria-current', 'location');
			} else {
				item.removeAttribute('aria-current');
			}
		});
	}

	function initBookmarkNav() {
		bookmarkNavItems = $$('[data-bookmark-nav]');
		bookmarkSections = bookmarkNavItems
			.map((item) => document.getElementById(item.getAttribute('aria-controls')))
			.filter(Boolean);
		if (!bookmarkNavItems.length || !bookmarkSections.length) return;
		setActiveBookmarkNav();
	}

	/* ---------------------------------------------------------- */
	/* Masonry (photos page)                                       */
	/* ---------------------------------------------------------- */

	const masonryInitialized = new WeakSet();
	let masonryLayoutRaf = null;

	function initMasonry() {
		const masonryContainer = $('#masonry-container');
		if (!masonryContainer || masonryInitialized.has(masonryContainer)) return;
		masonryInitialized.add(masonryContainer);

		if (typeof MiniMasonry === 'undefined') {
			console.error('MiniMasonry is not available.');
			return;
		}

		const loadmoreDom = $('#masonry-loadmore');
		const sentinelDom = $('#masonry-sentinel');
		const dataUrl = masonryContainer.dataset.masonryDataUrl || '/masonry/data.json';
		const batchSizeConfig = Number.parseInt(theme.page_templates?.masonry?.batch_size, 10);
		const initialBatchConfig = Number.parseInt(theme.page_templates?.masonry?.initial_batch_size, 10);

		const getBaseWidth = () => (window.innerWidth >= 768 ? 255 : 150);
		const getBlankPlaceholderSrc = () => 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

		const masonry = new MiniMasonry({
			baseWidth: getBaseWidth(),
			container: masonryContainer,
			gutterX: 10,
			gutterY: 10,
			surroundingGutter: false,
		});

		const scheduleLayout = () => {
			if (masonryLayoutRaf !== null) return;
			masonryLayoutRaf = window.requestAnimationFrame(() => {
				masonryLayoutRaf = null;
				masonry.layout();
			});
		};

		let items = [];
		let cursor = 0;
		let isLoading = false;
		const initialBatch = Number.isFinite(initialBatchConfig) ? Math.max(1, initialBatchConfig) : 24;
		const batchSize = Number.isFinite(batchSizeConfig) ? Math.max(1, batchSizeConfig) : 12;

		const imageObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const img = entry.target;
				imageObserver.unobserve(img);
				const dataSrc = img.dataset.lazySrc;
				if (dataSrc) img.src = dataSrc;
				img.dataset.lazyState = 'loaded';
			});
		}, { rootMargin: '200px 0px', threshold: 0.1 });

		const renderItem = (item) => {
			const masonryItem = document.createElement('div');
			masonryItem.className = 'group absolute box-border';
			masonryItem.dataset.masonryItem = '';

			const imageContainer = document.createElement('div');
			imageContainer.className = 'relative';

			const width = Number.parseInt(item.width, 10);
			const height = Number.parseInt(item.height, 10);
			const hasStableSize = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
			if (hasStableSize) {
				imageContainer.style.aspectRatio = `${width} / ${height}`;
			}

			const img = document.createElement('img');
			img.className =
				'!m-0 h-auto w-full cursor-zoom-in overflow-hidden rounded-2xl border border-rd-gray-alpha-400 !p-0 opacity-100 transition-[border-color,filter,opacity,transform] duration-300 data-[state=loading]:opacity-0 group-hover:border-rd-gray-alpha-400';
			img.dataset.state = 'loading';
			img.alt = item.title || '';
			if (hasStableSize) {
				img.width = width;
				img.height = height;
			}
			img.decoding = 'async';
			img.loading = 'lazy';
			img.dataset.lazySrc = item.image;
			img.dataset.lazyState = 'pending';
			img.src = getBlankPlaceholderSrc();
			img.dataset.exif = item?.exif ? 'true' : 'false';

			img.addEventListener('load', () => {
				if (img.dataset.lazyState === 'pending') return;
				img.dataset.state = 'loaded';
				if (!hasStableSize) scheduleLayout();
			});
			img.addEventListener('error', () => {
				img.dataset.state = 'loaded';
			});
			imageObserver.observe(img);
			imageContainer.appendChild(img);

			if (item.title) {
				const titleDom = document.createElement('div');
				titleDom.className =
					'absolute top-[5px] left-[5px] rounded-sm bg-rd-background-100/40 px-2.5 py-[5px] text-sm text-rd-gray-1000 opacity-0 backdrop-blur-[10px] transition-opacity duration-200 group-hover:opacity-100';
				titleDom.textContent = item.title;
				imageContainer.appendChild(titleDom);
			}
			if (item.description) {
				const descriptionDom = document.createElement('div');
				descriptionDom.className =
					'absolute right-[5px] bottom-[11px] max-w-[80%] rounded-sm bg-rd-background-100/40 px-2.5 py-[5px] text-sm text-rd-gray-1000 opacity-0 backdrop-blur-[10px] transition-opacity duration-200 group-hover:opacity-100';
				descriptionDom.textContent = item.description;
				imageContainer.appendChild(descriptionDom);
			}

			masonryItem.appendChild(imageContainer);
			return masonryItem;
		};

		const toggleLoading = (show) => {
			if (!loadmoreDom) return;
			loadmoreDom.hidden = !show;
			masonryContainer.setAttribute('aria-busy', String(show));
		};

		const appendBatch = (count) => {
			if (!masonryContainer.isConnected) return false;
			const batch = items.slice(cursor, cursor + count);
			if (batch.length === 0) return false;
			const fragment = document.createDocumentFragment();
			batch.forEach((item) => fragment.appendChild(renderItem(item)));
			masonryContainer.appendChild(fragment);
			cursor += batch.length;
			scheduleLayout();
			return cursor < items.length;
		};

		let sentinelObserver = null;
		const loadNextBatch = () => {
			if (isLoading) return;
			if (!masonryContainer.isConnected) return;
			isLoading = true;
			toggleLoading(true);
			const hasMore = appendBatch(batchSize);
			isLoading = false;
			toggleLoading(false);
			if (!hasMore && sentinelDom && sentinelObserver) {
				sentinelObserver.disconnect();
				sentinelDom.remove();
			}
		};

		sentinelObserver = sentinelDom
			? new IntersectionObserver((entries) => {
					if (entries.some((entry) => entry.isIntersecting)) loadNextBatch();
				}, { rootMargin: '200px 0px', threshold: 0.1 })
			: null;

		window.addEventListener('resize', () => {
			masonry.conf.baseWidth = getBaseWidth();
			scheduleLayout();
		});

		const init = async () => {
			masonryContainer.setAttribute('aria-busy', 'true');
			try {
				// 子相册页把数据内联在 data-masonry-items 上，无需再请求 JSON 端点
				const inlineJson = masonryContainer.dataset.masonryItems;
				if (inlineJson) {
					items = JSON.parse(inlineJson);
				} else {
					const response = await fetch(dataUrl);
					if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
					items = await response.json();
				}
			} catch (error) {
				console.error('Failed to load masonry data:', error);
				masonryContainer.setAttribute('aria-busy', 'false');
				if (sentinelDom) sentinelDom.remove();
				return;
			}
			if (!Array.isArray(items) || items.length === 0) {
				masonryContainer.setAttribute('aria-busy', 'false');
				if (sentinelDom) sentinelDom.remove();
				return;
			}
			if (!masonryContainer.isConnected) return;
			appendBatch(initialBatch);
			masonryContainer.classList.remove('min-h-screen');
			masonryContainer.setAttribute('aria-busy', 'false');
			if (cursor < items.length) {
				if (sentinelDom && sentinelObserver) sentinelObserver.observe(sentinelDom);
				else {
					while (cursor < items.length) appendBatch(batchSize);
				}
			} else if (sentinelDom) {
				sentinelDom.remove();
			}
		};

		init();
	}

	/* ---------------------------------------------------------- */
	/* Footer margin compensation                                  */
	/* ---------------------------------------------------------- */

	function initPageHeightHandle() {
		if ($('#home-banner')) return;
		const getElementHeight = (selector) => $(selector)?.getBoundingClientRect().height ?? 0;
		const tempH1 = getElementHeight('#page-header');
		const tempH2 = getElementHeight('#page-content');
		const tempH3 = getElementHeight('#site-footer');
		const allDomHeight = tempH1 + tempH2 + tempH3;
		const innerHeight = window.innerHeight;
		const footer = $('#site-footer');
		if (!footer) return;
		if (allDomHeight < innerHeight) {
			const marginTopValue = Math.floor(innerHeight - allDomHeight);
			if (marginTopValue > 0) {
				footer.style.marginTop = `${marginTopValue - 2}px`;
			}
		}
	}

	/* ---------------------------------------------------------- */
	/* Global scroll handlers                                      */
	/* ---------------------------------------------------------- */

	function onScroll() {
		updateScrollStyle();
		updateAutoHideTools();
	}

	let blurTimer = null;
	function onScrollBlur() {
		clearTimeout(blurTimer);
		blurTimer = setTimeout(updateHomeBannerBlur, 20);
	}

	let bookmarkScrollThrottle = 0;
	function onScrollBookmark() {
		const now = Date.now();
		if (now - bookmarkScrollThrottle < 100) return;
		bookmarkScrollThrottle = now;
		setActiveBookmarkNav();
	}

	/* ---------------------------------------------------------- */
	/* Boot                                                         */
	/* ---------------------------------------------------------- */

	function initGlobals() {
		initNavbarGlobals();
		initScrollTopBottom();
		initCategoryList();
		initTabs();
		initHomeBannerGlobals();
		initModeToggle();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		window.addEventListener('scroll', onScrollBlur, { passive: true });
		window.addEventListener('scroll', onScrollBookmark, { passive: true });
	}

	/* 沉浸式音乐页：同步 html[data-type="music"]（swup 不替换 html 属性） */
	function initPageType() {
		if (window.location.pathname.startsWith('/music/play')) {
			document.documentElement.dataset.type = 'music';
		} else {
			delete document.documentElement.dataset.type;
		}
	}

	/* 相册/音乐一级页：每次进入随机换一张模糊 banner 封面 */
	function initRandomBanner() {
		const img = $('#photos-banner-img') || $('#music-banner-img');
		if (!img || !img.dataset.covers) return;
		let covers = [];
		try {
			const parsed = JSON.parse(img.dataset.covers);
			if (Array.isArray(parsed)) covers = parsed.map(String).filter(Boolean);
		} catch {
			return;
		}
		if (covers.length < 2) return;
		const pick = covers[Math.floor(Math.random() * covers.length)];
		if (pick) img.src = pick;
	}

	/* 相册一级页：照片盲盒，每次 page:view 随机抽一张 */
	function initPhotosHome() {
		const dataEl = document.getElementById('photos-pool-data');
		const img = $('#photos-blindbox-img');
		const link = $('#photos-blindbox-link');
		const titleEl = $('#photos-blindbox-title');
		const albumEl = $('#photos-blindbox-album');
		if (!dataEl || !img || !link || !titleEl || !albumEl) return;
		let pool = [];
		try {
			const parsed = JSON.parse(dataEl.textContent || '[]');
			if (Array.isArray(parsed)) pool = parsed;
		} catch {
			return;
		}
		if (pool.length === 0) return;
		const photo = pool[Math.floor(Math.random() * pool.length)];
		img.src = photo.image;
		img.alt = photo.title || '';
		titleEl.textContent = photo.title || '';
		albumEl.textContent = photo.albumName || '';
		link.setAttribute('href', `/photos/${photo.slug}/`);
	}

	/* 音乐一级页：继续播放卡 + 随机歌单卡 */
	function initMusicHome() {
		const continueBox = $('#music-continue');
		if (continueBox) {
			let last = null;
			try {
				const parsed = JSON.parse(localStorage.getItem('music-last-played') || 'null');
				if (parsed && typeof parsed === 'object' && parsed.song) last = parsed;
			} catch {
				/* ignore */
			}
			if (last) {
				continueBox.innerHTML =
					`<a href="${escapeAttr(last.url)}" class="block rounded-xl border border-rd-gray-alpha-400 bg-rd-gray-100 p-3 transition-colors hover:!border-primary">` +
					`<span class="block truncate text-sm font-medium text-rd-gray-1000">${escapeAttr(last.song)}${last.artist ? `<span class="font-normal text-rd-gray-900"> - ${escapeAttr(last.artist)}</span>` : ''}</span>` +
					`<span class="mt-1 block truncate text-xs text-rd-gray-900">${escapeAttr(last.playlist || t('music', '音乐'))}</span></a>`;
			}
		}

		const randomBtn = $('#music-random-playlist');
		if (randomBtn && !randomBtn.dataset.wired) {
			randomBtn.dataset.wired = 'true';
			randomBtn.addEventListener('click', (event) => {
				const dataEl = document.getElementById('music-home-playlists-data');
				let urls = [];
				try {
					const parsed = JSON.parse(dataEl?.textContent || '[]');
					if (Array.isArray(parsed)) urls = parsed.filter(Boolean);
				} catch {
					/* ignore */
				}
				if (urls.length === 0) return;
				event.preventDefault();
				const url = urls[Math.floor(Math.random() * urls.length)];
				if (window.swup && typeof window.swup.loadPage === 'function') window.swup.loadPage({ url });
				else window.location.href = url;
			});
		}
	}

	function initPage() {
		initPageType();
		initRandomBanner();
		initPhotosHome();
		initMusicHome();
		cleanupMusicPage();
		initNavbarPage();
		initSideTools();
		initSidebarClamp();
		initHomeBanner();
		initBannerSwapper();
		initTyped();
		relativeTimeInHome();
		initTOC();
		initTocToggleButton();
		initGoComment();
		initFooterRuntime();
		initCopyCode();
		initPageHeightHandle();
		initLocalSearch();
		initImageViewer();
		initExpirationDate();
		initLazyLoad();
		initPangu();
		initMermaid();
		initAPlayer();
		initInlineAudio();
		initMusicPlay();
		initMusicTools();
		initEssays();
		initBookmarkNav();
		initMasonry();
		onScroll();
		updateHomeBannerBlur();
	}

	const boot = () => {
		initGlobals();
		initPage();
	};

	if (window.swup?.hooks) {
		window.swup.hooks.on('page:view', initPage);
		window.swup.hooks.on('visit:start', () => {
			setDrawerState(false);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot, { once: true });
	} else {
		boot();
	}
})();
