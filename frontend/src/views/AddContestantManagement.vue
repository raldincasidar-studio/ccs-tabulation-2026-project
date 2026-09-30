<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronRight } from "lucide-vue-next";
import Sidebar from "@/components/Sidebar.vue";
import starImage from "@/assets/img/star.png";
import queenPhoto from "@/assets/img/queen.png";
import cameraPlusImage from "@/assets/img/camm.svg";

const router = useRouter();
const categories = ["Mrs. Category", "Mr. Category"];
const category = ref(categories[0]);
const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMenuHidden = ref(false);
const fileInput = ref(null);
const saveMessage = ref("");
const contestant = ref({
	number: 1,
	name: "Japhet Bastillada",
	label: "Panthers",
	group: "Pageant Male",
	isActive: true,
	photo: queenPhoto,
});

const hasValidContestant = computed(() =>
	Number(contestant.value.number) > 0 &&
	contestant.value.name.trim() &&
	contestant.value.label.trim() &&
	contestant.value.group.trim(),
);

function updateViewportState() {
	isMobile.value = window.innerWidth < 768;
	if (isMobile.value) {
		isSidebarCollapsed.value = false;
		isMobileSidebarOpen.value = false;
		return;
	}

	isMenuHidden.value = false;
}

function handleScrollState() {
	if (!isMobile.value) {
		isMenuHidden.value = false;
		return;
	}

	const scrollTop = window.scrollY || window.pageYOffset;
	isMenuHidden.value = scrollTop > 12;
}

function openFilePicker() {
	fileInput.value?.click();
}

function handlePhotoChange(event) {
	const file = event.target.files?.[0];
	if (!file) return;
	if (contestant.value.photo.startsWith("blob:")) {
		URL.revokeObjectURL(contestant.value.photo);
	}
	contestant.value.photo = URL.createObjectURL(file);
	saveMessage.value = "";
}

function saveContestant() {
	if (!hasValidContestant.value) {
		saveMessage.value = "Complete all fields and enter a valid number.";
		return;
	}
	contestant.value.number = Number(contestant.value.number);
	saveMessage.value = "Contestant updated successfully!";
}

function handleLogout() {
	localStorage.removeItem("token");
	localStorage.removeItem("user");
	router.push("/login");
}

onMounted(() => {
	updateViewportState();
	handleScrollState();
	window.addEventListener("resize", updateViewportState);
	window.addEventListener("scroll", handleScrollState, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener("resize", updateViewportState);
	window.removeEventListener("scroll", handleScrollState);
	if (contestant.value.photo.startsWith("blob:")) {
		URL.revokeObjectURL(contestant.value.photo);
	}
});
</script>

<template>
	<div
		class="management-frame"
		:style="{ '--star-image': `url(${starImage})` }"
	>
		<div
			class="management-shell"
			:style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
		>
			<button
				v-if="isMobile"
				class="mobile-menu"
				:class="{ 'is-hidden': isMenuHidden }"
				type="button"
				aria-label="Open navigation menu"
				@click="isMobileSidebarOpen = true"
			>
				<span></span><span></span><span></span>
			</button>
			<div
				v-if="isMobile && isMobileSidebarOpen"
				class="mobile-overlay"
				@click="isMobileSidebarOpen = false"
			></div>
			<Sidebar
				active-item="CONTESTANTS"
				:is-mobile="isMobile"
				:is-sidebar-collapsed="isSidebarCollapsed"
				:is-mobile-sidebar-open="isMobileSidebarOpen"
				@toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
				@close-mobile-sidebar="isMobileSidebarOpen = false"
				@logout="handleLogout"
			/>

			<main class="main-content">
				<div class="page-content">
					<header class="management-banner">
						<h1>CONTESTANT MANAGEMENT</h1>
					</header>

					<div class="category-control">
						<label for="category">Select Category</label>
						<div class="category-select-wrap">
							<select id="category" v-model="category" aria-label="Select category">
								<option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
							</select>
							<ChevronRight :size="14" aria-hidden="true" />
						</div>
					</div>

					<form class="contestant-editor" @submit.prevent="saveContestant">
						<section class="photo-column" aria-label="Contestant photo">
							<div class="photo-frame">
								<img
									v-if="contestant.photo"
									class="photo-preview"
									:src="contestant.photo"
									alt="Contestant preview"
								/>
								<input
									ref="fileInput"
									class="file-input"
									type="file"
									accept="image/*"
									@change="handlePhotoChange"
								/>
								<button class="upload-button" type="button" @click="openFilePicker">
									<img class="upload-camera" :src="cameraPlusImage" alt="" />
									<span>Upload Photo</span>
								</button>
							</div>
						</section>

						<section class="contestant-fields" aria-label="Contestant information">
							<div class="number-field field">
								<label for="contestant-number">NUMBER</label>
								<input
									id="contestant-number"
									v-model="contestant.number"
									type="number"
									min="1"
								/>
							</div>
							<div class="paired-fields">
								<div class="field">
									<label for="contestant-name">NAME</label>
									<input id="contestant-name" v-model="contestant.name" type="text" />
								</div>
								<div class="field">
									<label for="contestant-label">LABEL</label>
									<input id="contestant-label" v-model="contestant.label" type="text" />
								</div>
							</div>
							<div class="group-field field">
								<label for="contestant-group">GROUP</label>
								<input id="contestant-group" v-model="contestant.group" type="text" />
							</div>
							<div class="form-actions">
								<div class="active-control">
									<span>Is Active</span>
									<button
										class="active-toggle"
										:class="{ on: contestant.isActive }"
										type="button"
										role="switch"
										:aria-checked="contestant.isActive"
										aria-label="Is Active"
										@click="contestant.isActive = !contestant.isActive"
									><i></i></button>
								</div>
								<button class="save-button" type="submit">
									SAVE
								</button>
							</div>
						</section>
					</form>
					<Teleport to="body">
						<p v-if="saveMessage" class="save-message" :class="{ error: !hasValidContestant }" role="status">
							{{ saveMessage }}
						</p>
					</Teleport>
				</div>
			</main>
		</div>
	</div>
</template>

<style scoped>
.management-frame,
.management-shell {
	min-height: 100vh;
	background: #f5f6f6;
}

.management-shell {
	--sidebar-width: 218px;
	position: relative;
	overflow-x: hidden;
	color: #08065a;
}

.main-content {
	min-height: 100vh;
	margin-left: var(--sidebar-width);
	padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px;
	transition: margin-left 0.25s ease;
}

.page-content {
	width: min(100%, 1040px);
	margin: 0 auto;
}

.management-banner {
	position: relative;
	display: flex;
	width: min(100%, 965px);
	height: clamp(120px, 13vw, 170px);
	align-items: flex-start;
	overflow: hidden;
	padding: clamp(18px, 2vw, 27px) clamp(18px, 2vw, 24px);
	border-radius: 17px;
	background-color: #09065d;
	background-image:
		var(--star-image), var(--star-image), var(--star-image), var(--star-image),
		linear-gradient(110deg, #09065d 0%, #111075 54%, #1710b5 100%);
	background-repeat: no-repeat;
	background-position: 39% 23%, 35% 66%, 72% 71%, 91% 43%, center;
	background-size: 17px 17px, 12px 12px, 12px 12px, 10px 10px, auto;
	box-sizing: border-box;
}

.management-banner::before {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(32deg, transparent 31%, rgb(161 184 255 / 35%) 31.1%, transparent 31.25%),
		linear-gradient(122deg, transparent 82%, rgb(161 184 255 / 30%) 82.1%, transparent 82.25%);
	content: "";
	pointer-events: none;
}

.management-banner h1 {
	position: relative;
	z-index: 1;
	margin: 0;
	color: #dedfff;
	font-family: "Croparo", Regular, sans-serif;
	font-size: clamp(2rem, 3vw, 3.1rem);
	font-weight: 500;
	line-height: 1;
	letter-spacing: 0;
	-webkit-text-stroke: 0.35px #fff;
	text-shadow: 0 0 5px rgb(200 203 255 / 35%);
}

.category-control {
	margin-top: 27px;
	margin-left: 7px;
}

.category-control > label,
.field > label {
	display: block;
	color: #2119ae;
	font-family: "Croparo", sans-serif;
	font-size: 11px;
	font-weight: 400;
	line-height: 1.2;
}

.category-control > label {
	font-family: "Poppins", sans-serif;
}

.field > label {
	font-family: "Croparo", sans-serif;
	font-size: clamp(0.8rem, 0.8vw + 0.45rem, 1rem);
	font-weight: 500;
	line-height: 100%;
	letter-spacing: 0;
}

.category-select-wrap {
	position: relative;
	width: min(100%, 153px);
	height: 24px;
	margin-top: 1px;
}

.category-select-wrap select {
	width: 100%;
	height: 100%;
	appearance: none;
	padding: 0 27px 0 12px;
	border: 0;
	border-radius: 4px;
	outline-color: #aaa8ff;
	background: #3327a6;
	box-shadow: 0 2px 5px rgb(10 10 64 / 24%);
	color: #fff;
	font-family: "Poppins", sans-serif;
	font-size: 12px;
}

.category-select-wrap svg {
	position: absolute;
	top: 5px;
	right: 12px;
	color: #fff;
	pointer-events: none;
}

.contestant-editor {
	display: grid;
	grid-template-columns: minmax(220px, 250px) minmax(0, 1fr);
	align-items: start;
	column-gap: clamp(18px, 2.8vw, 39px);
	margin-top: 58px;
	padding-left: 6px;
	width: min(100%, 920px);
}

.photo-column {
	min-width: 0;
}

.photo-frame {
	position: relative;
	display: flex;
	width: min(100%, 250px);
	aspect-ratio: 5 / 6.3;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border: 2px dashed #2d25c8;
	border-radius: 25px;
	box-sizing: border-box;
}

.photo-preview {
	position: absolute;
	inset: 25px 16px 48px;
	width: calc(100% - 32px);
	height: calc(100% - 73px);
	object-fit: contain;
}

.file-input {
	display: none;
}

.upload-button {
	position: absolute;
	right: 32px;
	bottom: 45px;
	left: 31px;
	display: flex;
	height: 24px;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: 0;
	border-radius: 4px;
	background: #1610a8;
	color: #fff;
	cursor: pointer;
	font-family: "Poppins", sans-serif;
	font-size: 10px;
	font-weight: 700;
}

.upload-button .upload-camera {
	position: absolute;
	top: -28px;
	left: 50%;
	width: 25px;
	height: 25px;
	filter: drop-shadow(0 0 2px rgb(80 74 255 / 35%));
	transform: translateX(-50%);
}

.contestant-fields {
	display: grid;
	min-width: 0;
	grid-template-columns: minmax(0, 1fr);
	row-gap: 0;
	margin-top: 6px;
}

.number-field {
	width: 70px;
	margin-left: 4px;
}

.field input {
	display: block;
	width: 100%;
	height: clamp(38px, 2.5vw, 42px);
	margin-top: 10px;
	padding: 0 16px;
	border: 0;
	border-radius: 5px;
	outline: 2px solid transparent;
	outline-offset: 1px;
	background: #08065a;
	color: #fff;
	font-family: "Poppins", sans-serif;
	font-size: 14px;
	font-weight: 400;
	box-sizing: border-box;
}

.field input:focus {
	outline-color: #7770ed;
}

.number-field input {
	padding: 0 8px;
	font-weight: 700;
	text-align: center;
}

.paired-fields {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: clamp(16px, 2.8vw, 41px);
	margin-top: 19px;
}

.group-field {
	width: min(100%, calc((100% - 41px) / 2));
	margin-top: 16px;
}

.form-actions {
	display: flex;
	align-items: flex-end;
	gap: clamp(18px, 5vw, 110px);
	margin-top: 25px;
	flex-wrap: wrap;
}

.active-control {
	display: flex;
	min-width: 63px;
	flex-direction: column;
	align-items: flex-start;
	gap: 7px;
	color: #080808;
	font-family: "Poppins", sans-serif;
	font-size: 10px;
	font-weight: 700;
	line-height: 12px;
}

.active-toggle {
	position: relative;
	width: 62px;
	height: 26px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: linear-gradient(#eceeef, #c7c9ca);
	box-shadow: inset 0 1px 2px rgb(0 0 0 / 8%);
	cursor: pointer;
}

.active-toggle i {
	position: absolute;
	top: 5px;
	left: 4px;
	width: 17px;
	height: 16px;
	border-radius: 50%;
	background: #8e9191;
	transition: left 0.18s ease, background 0.18s ease;
}

.active-toggle.on i {
	left: 34px;
	background: #35b900;
}

.save-button {
	width: 174px;
	height: 35px;
	margin-bottom: 1px;
	border: 0;
	border-radius: 999px;
	background: #08065a;
	color: #fff;
	cursor: pointer;
	font-family: "Poppins", sans-serif;
	font-size: 11px;
	font-weight: 700;
}

.save-button:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}

.save-message {
	position: fixed;
	right: 24px;
	bottom: 24px;
	z-index: 40;
	margin: 0;
	padding: 10px 16px;
	border-radius: 6px;
	background: #fff;
	box-shadow: 0 4px 16px rgb(8 6 90 / 16%);
	color: #218500;
	font-family: "Poppins", sans-serif;
	font-size: 12px;
}

.save-message.error { color: #a11b32; }

.mobile-menu {
	display: none;
}

@media (max-width: 1100px) {
	.management-frame,
	.management-shell {
		overflow-x: hidden;
	}

	.main-content { padding-right: 24px; padding-left: 24px; }
	.page-content { width: 100%; }
	.management-banner { width: 100%; }
	.contestant-editor {
		grid-template-columns: 250px minmax(0, 1fr);
		column-gap: 24px;
		width: 100%;
		max-width: 100%;
	}
	.contestant-editor .photo-frame { width: 250px; }
	.contestant-editor .paired-fields { gap: 24px; }
	.contestant-editor .group-field { width: calc((100% - 24px) / 2); }
	.contestant-editor .form-actions { gap: 40px; }
}

@media (max-width: 767px) {
	.management-frame,
	.management-shell {
		overflow-x: hidden;
	}

	.main-content {
		margin-left: 0;
		padding: 78px 18px 36px;
	}
	.page-content { width: 100%; }
	.management-banner {
		height: auto;
		min-height: 132px;
		align-items: center;
		padding: 20px 18px;
		border-radius: 14px;
	}
	.management-banner h1 {
		font-size: clamp(1.8rem, 7vw, 3.2rem);
		line-height: 1.05;
		letter-spacing: 0.04em;
	}
	.category-control {
		margin-top: 20px;
		margin-left: 0;
	}
	.category-select-wrap {
		width: min(100%, 220px);
	}
	.contestant-editor {
		width: 100%;
		max-width: 100%;
		grid-template-columns: 1fr;
		justify-items: stretch;
		gap: 24px;
		margin-top: 28px;
		padding-left: 0;
	}
	.photo-column,
	.contestant-fields {
		width: 100%;
	}
	.photo-frame {
		width: 100%;
		max-width: 360px;
		height: 280px;
		margin: 0 auto;
	}
	.contestant-fields {
		row-gap: 0;
		padding-top: 0;
	}
	.number-field {
		width: 100%;
		max-width: 120px;
		margin-left: 0;
	}
	.paired-fields {
		grid-template-columns: 1fr;
		gap: 18px;
		margin-top: 18px;
	}
	.group-field {
		width: 100%;
	}
	.form-actions {
		justify-content: space-between;
		gap: 12px;
		margin-top: 24px;
		flex-wrap: wrap;
	}
	.save-button {
		width: min(174px, 100%);
		flex: 1 1 140px;
	}
	.mobile-menu {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 10;
		display: flex;
		width: 38px;
		height: 34px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		border: 1px solid #2d25c8;
		border-radius: 5px;
		background: #08065a;
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
		transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
	}

	.mobile-menu.is-hidden {
		opacity: 0;
		visibility: hidden;
		transform: translateY(-10px);
		pointer-events: none;
	}
	.mobile-menu span { width: 18px; height: 2px; background: #fff; }
	.mobile-overlay { position: fixed; inset: 0; z-index: 12; background: rgb(0 0 0 / 45%); }
}

@media (max-width: 420px) {
	.main-content { padding-right: 12px; padding-left: 12px; }
	.management-banner { min-height: 105px; padding: 18px 16px; }
	.management-banner h1 { font-size: clamp(1.55rem, 8.2vw, 2.5rem); }
	.category-select-wrap {
		width: 100%;
		max-width: 100%;
	}
	.photo-frame {
		width: 100%;
		height: 250px;
	}
	.upload-button {
		right: 16px;
		left: 16px;
		bottom: 18px;
	}
	.form-actions {
		align-items: stretch;
	}
	.save-button {
		width: 100%;
		max-width: none;
	}
}

@media (min-width: 768px) {
	.photo-column { padding-top: 0; }
}
</style>
