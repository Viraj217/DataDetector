package com.datadetector.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.os.Build
import android.widget.RemoteViews
import com.datadetector.MainActivity
import com.datadetector.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DataUsageWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.datadetector.widget.REFRESH") {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, DataUsageWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            // Setup launch app intent on widget click
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Query usage metrics directly from SQLite database
            val todayTotalBytes = getTodayTotalBytes(context)
            val budgetBytes = getMonthlyBudgetBytes(context)

            // Format total text
            val formatted = formatBytes(todayTotalBytes)
            views.setTextViewText(R.id.widget_usage_value, formatted.first)
            views.setTextViewText(R.id.widget_usage_unit, formatted.second)

            // Update progress bar
            if (budgetBytes > 0) {
                val progressPercent = ((todayTotalBytes.toDouble() / budgetBytes) * 100).toInt()
                views.setProgressBar(R.id.widget_progress, 100, progressPercent.coerceIn(0, 100), false)
                views.setTextViewText(R.id.widget_progress_text, "$progressPercent% of budget")
            } else {
                views.setProgressBar(R.id.widget_progress, 100, 0, false)
                views.setTextViewText(R.id.widget_progress_text, "No limit set")
            }

            // Instruct the widget manager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun getTodayTotalBytes(context: Context): Long {
            var totalBytes = 0L
            val dbFile = context.getDatabasePath("datadetector.sqlite")
            if (!dbFile.exists()) return 0L

            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val todayStr = dateFormat.format(Date())

            try {
                val db = SQLiteDatabase.openDatabase(
                    dbFile.absolutePath,
                    null,
                    SQLiteDatabase.OPEN_READONLY
                )
                val cursor = db.rawQuery(
                    "SELECT SUM(rx_bytes + tx_bytes) FROM daily_usage WHERE date = ?",
                    arrayOf(todayStr)
                )
                if (cursor.moveToFirst()) {
                    totalBytes = cursor.getLong(0)
                }
                cursor.close()
                db.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return totalBytes
        }

        private fun getMonthlyBudgetBytes(context: Context): Long {
            var budgetBytes = 0L
            val dbFile = context.getDatabasePath("datadetector.sqlite")
            if (!dbFile.exists()) return 0L
            try {
                val db = SQLiteDatabase.openDatabase(
                    dbFile.absolutePath,
                    null,
                    SQLiteDatabase.OPEN_READONLY
                )
                val cursor = db.rawQuery(
                    "SELECT value FROM settings WHERE key = ? LIMIT 1",
                    arrayOf("monthly_cap_bytes")
                )
                if (cursor.moveToFirst()) {
                    val value = cursor.getString(0)
                    budgetBytes = value.toLongOrNull() ?: 0L
                }
                cursor.close()
                db.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return budgetBytes
        }

        private fun formatBytes(bytes: Long): Pair<String, String> {
            return when {
                bytes >= 1024L * 1024 * 1024 -> Pair(String.format("%.2f", bytes.toDouble() / (1024 * 1024 * 1024)), "GB")
                bytes >= 1024L * 1024 -> Pair(String.format("%.1f", bytes.toDouble() / (1024 * 1024)), "MB")
                bytes >= 1024L -> Pair(String.format("%.0f", bytes.toDouble() / 1024), "KB")
                else -> Pair(bytes.toString(), "B")
            }
        }
    }
}
