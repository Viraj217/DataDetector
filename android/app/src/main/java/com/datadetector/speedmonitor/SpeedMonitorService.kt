package com.datadetector.speedmonitor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.TrafficStats
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.datadetector.MainActivity

class SpeedMonitorService : Service() {

    private val CHANNEL_ID = "speed_monitor_channel"
    private val NOTIFICATION_ID = 9999
    private var handler: Handler? = null
    private var lastRxBytes = 0L
    private var lastTxBytes = 0L

    private val speedRunnable = object : Runnable {
        override fun run() {
            val currentRx = TrafficStats.getTotalRxBytes()
            val currentTx = TrafficStats.getTotalTxBytes()

            if (lastRxBytes != 0L && lastTxBytes != 0L) {
                val rxSpeed = currentRx - lastRxBytes
                val txSpeed = currentTx - lastTxBytes
                updateNotification(rxSpeed, txSpeed)
            }

            lastRxBytes = currentRx
            lastTxBytes = currentTx

            handler?.postDelayed(this, 1000)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Calculating speed...", ""))
        
        handler = Handler(Looper.getMainLooper())
        handler?.post(speedRunnable)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler?.removeCallbacks(speedRunnable)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Real-Time Speed Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live download and upload network speed in notification bar."
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, text: String): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, flags)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun updateNotification(rxSpeed: Long, txSpeed: Long) {
        val downSpeed = formatSpeed(rxSpeed)
        val upSpeed = formatSpeed(txSpeed)
        
        val notification = buildNotification(
            "Live Speed Monitor",
            "⬇ Down: $downSpeed | ⬆ Up: $upSpeed"
        )
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun formatSpeed(bytesPerSec: Long): String {
        return when {
            bytesPerSec >= 1024 * 1024 -> String.format("%.1f MB/s", bytesPerSec.toDouble() / (1024 * 1024))
            bytesPerSec >= 1024 -> String.format("%.1f KB/s", bytesPerSec.toDouble() / 1024)
            else -> "$bytesPerSec B/s"
        }
    }
}
