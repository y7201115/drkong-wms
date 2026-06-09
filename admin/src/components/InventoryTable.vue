<template>
  <el-table
    :data="data"
    :loading="loading"
    stripe
    border
    style="width: 100%"
    v-bind="$attrs"
  >
    <el-table-column prop="articleNo" label="货号" width="120" sortable />
    <el-table-column prop="size" label="尺码" width="80" sortable />
    <el-table-column prop="stock" label="库存数量" width="120" sortable>
      <template #default="{ row }">
        <el-tag
          :type="getInventoryStatusTag(row.stock).type"
          size="small"
        >
          {{ row.stock }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="barcode" label="条形码" width="180" />
    <el-table-column prop="updateTime" label="更新时间" width="180">
      <template #default="{ row }">
        {{ formatDate(row.updateTime) }}
      </template>
    </el-table-column>
    <el-table-column label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="getInventoryStatusTag(row.stock).tagType" size="small">
          {{ getInventoryStatusTag(row.stock).text }}
        </el-tag>
      </template>
    </el-table-column>
    <slot></slot>
  </el-table>
</template>

<script setup>
import { getInventoryStatus } from '@/utils/format'
import { formatDate } from '@/utils/format'

defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function getInventoryStatusTag(count) {
  const status = getInventoryStatus(count)
  const tagMap = {
    'danger': 'danger',
    'warning': 'warning',
    'success': 'success',
    'info': 'info'
  }
  return {
    text: status.text,
    tagType: tagMap[status.type] || 'info'
  }
}
</script>
