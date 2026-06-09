<template>
  <div class="stat-card" :style="{ borderTop: `3px solid ${color}` }">
    <div class="stat-card-content">
      <div class="stat-info">
        <p class="stat-title">{{ title }}</p>
        <p class="stat-value">{{ value }}</p>
        <p v-if="subtitle" class="stat-subtitle">{{ subtitle }}</p>
      </div>
      <div class="stat-icon" :style="{ backgroundColor: color + '20' }">
        <el-icon :size="28" :color="color">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: 'DataBoard'
  },
  color: {
    type: String,
    default: '#409EFF'
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.stat-card {
  background: $bg-white;
  border-radius: $border-radius-small;
  box-shadow: $shadow-light;
  padding: $spacing-lg;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: $shadow-medium;
    transform: translateY(-2px);
  }
}

.stat-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.2;
}

.stat-subtitle {
  font-size: 12px;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: $border-radius-small;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
