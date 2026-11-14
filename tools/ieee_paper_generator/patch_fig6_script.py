import os

# 1. Update generate_figures_bw.py for Figure 6
fig_script = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\generate_figures_bw.py'

with open(fig_script, 'r', encoding='utf-8') as f:
    fig_code = f.read()

# Replace generate_fig6 in generate_figures_bw.py
old_fig6_start = 'def generate_fig6():'
new_fig6_code = '''def generate_fig6():
    print("Generating Figure 6: Candidate Classifier Comparison (Annotation Outside Plotting Area)...")
    fig, ax = plt.subplots(figsize=(9.2, 5.2), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    models = [
        "LinearSVC\\n(C=2.0)",
        "Logistic Regression\\n(C=2.0, Selected)",
        "Multinomial Naive Bayes\\n(alpha=0.1)"
    ]

    acc_means = [81.79, 79.88, 76.92]
    acc_stds  = [ 2.29,  3.15,  2.18]
    f1_macros = [78.69, 76.00, 73.17]

    x = np.arange(len(models))
    bar_width = 0.32

    r1 = ax.bar(x - bar_width/2 - 0.02, acc_means, bar_width, yerr=acc_stds,
                capsize=5, color='white', edgecolor='black', linewidth=1.2,
                label='Group CV Accuracy (%) ± Std Dev')

    r2 = ax.bar(x + bar_width/2 + 0.02, f1_macros, bar_width,
                color='#D8D8D8', edgecolor='black', linewidth=1.2, hatch='//',
                label='Macro-F1 Score (%)')

    for i in range(len(models)):
        ax.text(x[i] - bar_width/2 - 0.02, acc_means[i] + acc_stds[i] + 1.0,
                f"{acc_means[i]:.2f}%\\n±{acc_stds[i]:.2f}%", ha='center', va='bottom',
                fontsize=8.0, fontweight='bold', color='black')
        ax.text(x[i] + bar_width/2 + 0.02, f1_macros[i] + 1.0,
                f"{f1_macros[i]:.2f}%", ha='center', va='bottom',
                fontsize=8.0, fontweight='bold', color='black')

    ax.set_ylabel('Performance Metric (%)', fontsize=9.8, fontweight='bold', fontfamily='serif')
    ax.set_title('Candidate Classifier Comparison Across Five-Fold GroupKFold Cross-Validation (N=1,560)',
                 fontsize=10.0, fontweight='bold', pad=10, fontfamily='serif')
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=8.8, fontfamily='serif')
    ax.set_ylim(68, 92)

    ax.yaxis.grid(True, linestyle=':', alpha=0.6, color='black')
    ax.xaxis.grid(False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(loc='upper right', frameon=True, edgecolor='black', fontsize=8.2)

    # Place explanatory annotation OUTSIDE the chart plotting area
    plt.subplots_adjust(bottom=0.24, top=0.92, left=0.10, right=0.95)
    fig.text(0.525, 0.03,
            "Selection Rationale: Logistic Regression was selected over LinearSVC because its multinomial softmax outputs\\n"
            r"provide native posterior probabilities directly usable for threshold-based out-of-distribution rejection ($\\\\tau=0.20$),"
            "\\nwithout requiring an auxiliary probability calibration layer.",
            ha='center', va='bottom', fontsize=7.8, style='italic',
            bbox=dict(boxstyle='square,pad=0.4', facecolor='white', edgecolor='black', lw=0.8))

    p = os.path.join(OUT_DIR, 'Figure6_Model_Comparison.png')
    plt.savefig(p, dpi=300, facecolor='white')
    plt.close()
    print(f"Saved: {p}")
'''

idx_fig6 = fig_code.find('def generate_fig6():')
idx_main = fig_code.find('def main():')

fig_code = fig_code[:idx_fig6] + new_fig6_code + '\n' + fig_code[idx_main:]

with open(fig_script, 'w', encoding='utf-8') as f:
    f.write(fig_code)

print("generate_figures_bw.py updated with outside-plotting-area Figure 6 annotation!")

