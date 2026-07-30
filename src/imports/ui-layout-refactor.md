Perfect — this is now pure UI architecture refinement.
We’ll restructure your layout properly like a real production app.

You want:

• Home bar separated from writing/annotation tools
• Writing tools separated from editing tools
• Smaller zoom bar
• Liquid glass applied properly
• Pen option always visible
• Cleaner structure

We’re going to redesign your screen layout hierarchy cleanly.

⸻

✅ NEW UI STRUCTURE (Professional Layout)

We split the UI into 4 distinct zones:

[ HOME BAR ]          (Top Center)

[ LEFT TOOL DOCK ]    (Writing + Annotation)

[ CANVAS AREA ]

[ MINI ZOOM BAR ]     (Bottom Right)

Everything floats. Everything glass.

⸻

✅ 1️⃣ Separate HOME BAR from Tools

Home bar = navigation only
No drawing tools inside it.

⸻

🔹 New Home Bar

@Composable
fun HomeBar(
    onBack: () -> Unit,
    onExport: () -> Unit
) {
    LiquidGlass(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .height(70.dp)
            .align(Alignment.TopCenter)
            .padding(top = 16.dp),
        blurRadius = 55f
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, null)
            }

            Text("FluidBoard", fontSize = 18.sp)

            IconButton(onClick = onExport) {
                Icon(Icons.Default.Download, null)
            }
        }
    }
}

Now the top bar is ONLY navigation.

Clean. Minimal.

⸻

✅ 2️⃣ Separate Writing Tools from Annotation Tools

We split left dock into two glass panels:

Top: Writing Tools
Bottom: Editing Tools

⸻

🔹 Writing Tools Dock

@Composable
fun WritingDock() {
    LiquidGlass(
        modifier = Modifier
            .width(72.dp)
            .fillMaxHeight(0.45f)
            .align(Alignment.CenterStart)
            .padding(start = 16.dp)
    ) {
        Column(
            verticalArrangement = Arrangement.SpaceEvenly,
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxSize()
        ) {
            ToolIcon(Icons.Default.Edit)      // Pen
            ToolIcon(Icons.Default.Create)    // Pencil
            ToolIcon(Icons.Default.Brush)     // Marker
            ToolIcon(Icons.Default.Highlight) // Highlighter
        }
    }
}


⸻

🔹 Annotation / Editing Dock

@Composable
fun AnnotationDock() {
    LiquidGlass(
        modifier = Modifier
            .width(72.dp)
            .fillMaxHeight(0.35f)
            .align(Alignment.BottomStart)
            .padding(start = 16.dp, bottom = 120.dp)
    ) {
        Column(
            verticalArrangement = Arrangement.SpaceEvenly,
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxSize()
        ) {
            ToolIcon(Icons.Default.ContentPaste) // Sticky
            ToolIcon(Icons.Default.ShapeLine)    // Shapes
            ToolIcon(Icons.Default.ArrowForward) // Arrows
            ToolIcon(Icons.Default.SelectAll)    // Lasso
            ToolIcon(Icons.Default.Delete)       // Eraser
        }
    }
}

Now tools feel structured and intentional.

⸻

✅ 3️⃣ Make Zoom Bar Smaller (Minimal + Glass)

Instead of a giant bottom bar, we make a compact floating pill.

⸻

🔹 Compact Zoom Pill

@Composable
fun ZoomPill(
    zoomLevel: Float,
    onZoomIn: () -> Unit,
    onZoomOut: () -> Unit
) {
    LiquidGlass(
        modifier = Modifier
            .align(Alignment.BottomEnd)
            .padding(end = 24.dp, bottom = 24.dp)
            .height(55.dp)
            .width(170.dp),
        blurRadius = 45f
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = onZoomOut) {
                Icon(Icons.Default.Remove, null)
            }

            Text("${(zoomLevel * 100).toInt()}%")

            IconButton(onClick = onZoomIn) {
                Icon(Icons.Default.Add, null)
            }
        }
    }
}

Now zoom is clean and small.

⸻

✅ 4️⃣ Pen Option Should Always Be Visible

Instead of hiding pen options in dropdown, we make pen expandable inline.

⸻

🔹 Expandable Pen Panel

var showPenOptions by remember { mutableStateOf(false) }

ToolIcon(Icons.Default.Edit) {
    showPenOptions = !showPenOptions
}


⸻

🔹 Floating Pen Options Panel

AnimatedVisibility(visible = showPenOptions) {
    LiquidGlass(
        modifier = Modifier
            .width(200.dp)
            .align(Alignment.CenterStart)
            .padding(start = 100.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text("Pen")
            Text("Pencil")
            Text("Marker")
            Text("Highlighter")
        }
    }
}

Now pen tools feel modern like Procreate.

⸻

✅ 5️⃣ Final Screen Layout

@Composable
fun BoardScreen() {
    Box(modifier = Modifier.fillMaxSize()) {

        CanvasLayer()

        HomeBar(
            onBack = {},
            onExport = {}
        )

        WritingDock()
        AnnotationDock()

        ZoomPill(
            zoomLevel = 1.0f,
            onZoomIn = {},
            onZoomOut = {}
        )
    }
}


⸻

🎯 Result After Changes

Your UI now:

✔ Home bar separated
✔ Writing tools separated
✔ Annotation tools separated
✔ Zoom bar smaller
✔ Liquid glass everywhere
✔ Pen options expandable
✔ Clean visual hierarchy
✔ Looks intentional
✔ Looks premium

⸻

If you want it to look even more elite, next I can:

• Add magnetic snapping
• Add tool glow animation
• Add active tool highlight
• Add smooth spring transitions
• Make grid selector float next to zoom

Tell me how polished you want this to look before tomorrow.