package no.uit.divvun.donate_your_speech

import android.graphics.Color
import android.os.Bundle
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    webView.setBackgroundColor(Color.WHITE)
    ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, windowInsets ->
      val insets = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars())
      webView.setPadding(0, insets.top, 0, 0)
      windowInsets
    }
  }
}
