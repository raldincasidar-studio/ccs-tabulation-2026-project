<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'

const props = defineProps({
	judges: Array,
	isLoading: Boolean,
	errorMessage: String,
})

const judges = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const emit = defineEmits(['add', 'edit', 'delete'])

const tableJudges = computed(() => props.judges ?? judges.value)
const tableIsLoading = computed(() => props.isLoading ?? isLoading.value)
const tableErrorMessage = computed(() => props.errorMessage ?? errorMessage.value)

async function loadJudges() {
	if (props.judges !== undefined) return

	isLoading.value = true
	errorMessage.value = ''

	try {
		const response = await api.get('/judges')
		const result = Array.isArray(response) ? response : response?.data
		judges.value = Array.isArray(result) ? result : []
	} catch (error) {
		errorMessage.value = error?.message || 'Unable to load judges.'
	} finally {
		isLoading.value = false
	}
}

onMounted(loadJudges)
</script>

<template>
	<section class="judge-management-table" aria-label="Judge management">
		<div class="table-divider" aria-hidden="true"></div>

		<div class="table-scroll">
			<div class="table-content">
				<div class="table-actions">
					<button class="add-button" type="button" @click="emit('add')">+ Add</button>
				</div>

				<div class="table-header" role="row">
					<div class="header-cell" role="columnheader">#</div>
					<div class="header-cell name-header" role="columnheader">Name</div>
					<div class="header-cell" role="columnheader">Username</div>
					<div class="header-cell" role="columnheader">Is Active</div>
					<div class="header-cell" role="columnheader">Actions</div>
				</div>

				<div v-if="tableIsLoading" class="table-message" role="status">Loading judges...</div>
				<div v-else-if="tableErrorMessage" class="table-message error-message" role="alert">
					{{ tableErrorMessage }}
				</div>
				<div v-else-if="tableJudges.length === 0" class="table-message">No judges found</div>

				<div v-else class="judge-rows" role="rowgroup">
					<div v-for="(judge, index) in tableJudges" :key="judge._id" class="judge-row" role="row">
						<div class="judge-number" role="cell">{{ index + 1 }}</div>
						<div class="judge-name" role="cell">{{ [judge.firstName, judge.lastName].filter(Boolean).join(' ') }}</div>
						<div class="judge-username" role="cell">{{ judge.username }}</div>
						<div class="judge-active" role="cell">{{ judge.isActive ? 'Yes' : 'No' }}</div>
						<div class="judge-actions" role="cell">
							<button type="button" class="edit-button" @click="emit('edit', judge)">Edit</button>
							<button type="button" class="delete-button" @click="emit('delete', judge)">Delete</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.judge-management-table {
	width: 100%;
	color: #fff;
	font-family: 'Poppins', sans-serif;
}

.table-divider {
	width: min(963px, calc(100% - 37px));
	height: 1px;
	margin-left: 37px;
	background: #171717;
}

.table-scroll {
	width: 100%;
	overflow-x: auto;
}

.table-content {
	width: min(982px, calc(100% - 29px));
	min-width: 700px;
	margin-left: 29px;
}

.table-actions {
	display: flex;
	height: 62px;
	align-items: flex-end;
	justify-content: flex-end;
	padding: 0 4px 7px;
	box-sizing: border-box;
}

.add-button,
.edit-button,
.delete-button {
	border: 0;
	background: transparent;
	font: inherit;
	cursor: pointer;
}

.add-button {
	padding: 0;
	color: #063eff;
	font-size: 18px;
	font-weight: 700;
	line-height: 100%;
}

.table-header,
.judge-row {
	display: grid;
	grid-template-columns: 66px minmax(150px, 1.27fr) minmax(130px, 1.12fr) minmax(110px, 1fr) minmax(125px, 0.79fr);
	align-items: center;
}

.table-header {
	min-height: 52px;
	overflow: hidden;
	border-radius: 7px;
	background: linear-gradient(105deg, #e8f000 0%, #b7cb00 24%, #609885 53%, #053fd0 100%);
	color: #fff;
	font-size: 18px;
	font-weight: 500;
}

.table-header .header-cell:first-child {
	color: #052a83;
	font-weight: 700;
}

.header-cell {
	display: flex;
	min-width: 0;
	height: 100%;
	align-items: center;
	justify-content: center;
}

.table-header .header-cell:not(:first-child) {
	font-family: 'Poppins', sans-serif;
	font-size: 18.23px;
	font-style: normal;
	font-weight: 500;
	line-height: 100%;
	letter-spacing: 0;
}

.name-header {
	justify-content: flex-start;
	padding-left: 16px;
	color: #011e60;
}

.judge-rows {
	display: grid;
	width: calc(100% + 2px);
	gap: 3px;
	margin-top: 41px;
	margin-left: 2px;
}

.judge-row {
	min-height: 48px;
	grid-template-columns: 64px minmax(150px, 1.27fr) minmax(130px, 1.12fr) minmax(110px, 1fr) minmax(125px, 0.79fr);
	color: #fff;
	font-size: 15px;
}

.judge-number,
.judge-name,
.judge-username,
.judge-active,
.judge-actions {
	display: flex;
	min-width: 0;
	height: 100%;
	min-height: 48px;
	align-items: center;
	box-sizing: border-box;
}

.judge-number {
	justify-content: center;
	border-radius: 6px;
	background: linear-gradient(105deg, #062b91, #0649cf);
	color: #f2f000;
	font-weight: 500;
}

.judge-name,
.judge-username,
.judge-active,
.judge-actions {
	background: #0845c5;
}

.judge-name {
	margin-left: 7px;
	padding: 0 9px;
	border-radius: 6px 0 0 6px;
}

.judge-username,
.judge-active {
	justify-content: center;
	padding: 0 8px;
}

.judge-actions {
	justify-content: center;
	gap: 26px;
	padding: 0 8px;
	border-radius: 0 6px 6px 0;
}

.edit-button,
.delete-button {
	padding: 0;
	font-size: 15px;
	font-weight: 700;
}

.edit-button {
	color: #fff;
}

.delete-button {
	color: #ff1d16;
}

.table-message {
	display: flex;
	min-height: 96px;
	align-items: center;
	justify-content: center;
	margin-top: 24px;
	border-radius: 6px;
	background: #0845c5;
	color: #fff;
	font-size: 15px;
}

.error-message {
	color: #ffd6d4;
}

@media (max-width: 767px) {
	.table-divider {
		width: 100%;
		margin-left: 0;
	}

	.table-content {
		width: 982px;
		margin-left: 0;
	}

	.table-actions {
		height: 54px;
	}

	.table-header {
		min-height: 48px;
		font-size: 15px;
	}

	.judge-rows {
		margin-top: 28px;
	}
}
</style>
