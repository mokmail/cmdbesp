import streamlit as st
import pandas as pd
import os
import html

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

CSV_FILES = [f for f in os.listdir(DATA_DIR) if f.endswith('.csv') and os.path.isfile(os.path.join(DATA_DIR, f))]
CSV_FILES.sort()

st.set_page_config(page_title="CMDB ESP Dashboard", layout="wide")
st.title("CMDB ESP Dashboard")

view_mode = st.sidebar.radio("View mode:", ["Single File", "Compare Files", "Compare Shares to ESP"])

def load_csv(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if filename.endswith(".csv"):
        try:
            try:
                df = pd.read_csv(filepath, delimiter=";")
                if df.shape[1] < 2:
                    df = pd.read_csv(filepath)
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, delimiter=";", encoding="latin1")
                if df.shape[1] < 2:
                    df = pd.read_csv(filepath, encoding="latin1")
            return df
        except Exception as e:
            st.error(f"Error loading {filename}: {e}")
            return None
    return None

if view_mode == "Single File":
    sidebar_selection = st.sidebar.selectbox("Select a file to view:", [""] + CSV_FILES)

    if sidebar_selection:
        st.header(f"{sidebar_selection}")
        df = load_csv(sidebar_selection)
        if df is not None:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Rows", df.shape[0])
            with col2:
                st.metric("Columns", df.shape[1])
            with col3:
                st.metric("Memory (MB)", round(df.memory_usage(deep=True).sum() / 1024 ** 2, 2))

            with st.expander("Filter", expanded=False):
                filter_col = st.selectbox("Filter by column:", [""] + list(df.columns), key="filter_col_single")
                if filter_col:
                    unique_vals = df[filter_col].dropna().unique()
                    selected_vals = st.multiselect(
                        f"Select {filter_col} values:", sorted(unique_vals), default=list(unique_vals), key="filter_vals_single"
                    )
                    df = df[df[filter_col].isin(selected_vals)]

            st.dataframe(df, width="stretch", height=600)
    else:
        st.subheader("Available files")
        cols = st.columns(2)
        for i, csv in enumerate(CSV_FILES):
            with cols[i % 2]:
                st.markdown(f"### {csv}")
                df = load_csv(csv)
                if df is not None:
                    st.caption(f"{df.shape[0]} rows x {df.shape[1]} columns")
                    st.dataframe(df.head(5), width="stretch")
                    if df.shape[0] > 5:
                        st.caption(f"... and {df.shape[0] - 5} more rows")

elif view_mode == "Compare Files":
    file_a = st.sidebar.selectbox("File A:", CSV_FILES, index=0, key="file_a")
    file_b = st.sidebar.selectbox("File B:", CSV_FILES, index=1, key="file_b")

    df_a = load_csv(file_a)
    df_b = load_csv(file_b)

    if df_a is not None and df_b is not None:
        st.header(f"Comparing: {file_a} vs {file_b}")

        with st.expander("Filter File A", expanded=False):
            filter_col_a = st.selectbox("Filter by column:", [""] + list(df_a.columns), key="filter_col_a")
            if filter_col_a:
                unique_vals_a = df_a[filter_col_a].dropna().unique()
                selected_vals_a = st.multiselect(
                    f"Select {filter_col_a} values:", sorted(unique_vals_a), default=list(unique_vals_a), key="filter_vals_a"
                )
                df_a = df_a[df_a[filter_col_a].isin(selected_vals_a)]

        with st.expander("Filter File B", expanded=False):
            filter_col_b = st.selectbox("Filter by column:", [""] + list(df_b.columns), key="filter_col_b")
            if filter_col_b:
                unique_vals_b = df_b[filter_col_b].dropna().unique()
                selected_vals_b = st.multiselect(
                    f"Select {filter_col_b} values:", sorted(unique_vals_b), default=list(unique_vals_b), key="filter_vals_b"
                )
                df_b = df_b[df_b[filter_col_b].isin(selected_vals_b)]

        col_stats1, col_stats2 = st.columns(2)
        with col_stats1:
            st.metric(f"{file_a} - Rows", df_a.shape[0])
            st.metric(f"{file_a} - Columns", df_a.shape[1])
        with col_stats2:
            st.metric(f"{file_b} - Rows", df_b.shape[0])
            st.metric(f"{file_b} - Columns", df_b.shape[1])

        common_cols = list(set(df_a.columns) & set(df_b.columns))
        only_a = [c for c in df_a.columns if c not in df_b.columns]
        only_b = [c for c in df_b.columns if c not in df_a.columns]

        st.subheader("Column Comparison")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("**Common columns**")
            st.write(common_cols if common_cols else "None")
        with c2:
            st.markdown(f"**Only in {file_a}**")
            st.write(only_a if only_a else "None")
        with c3:
            st.markdown(f"**Only in {file_b}**")
            st.write(only_b if only_b else "None")

        if common_cols:
            merge_col = st.selectbox("Select column to compare rows on:", common_cols, key="merge_col")
            if merge_col:
                merged = pd.merge(df_a, df_b, on=merge_col, how="outer", suffixes=(f" ({file_a})", f" ({file_b})"), indicator=True)

                only_in_a = merged[merged["_merge"] == "left_only"]
                only_in_b = merged[merged["_merge"] == "right_only"]
                in_both = merged[merged["_merge"] == "both"]

                tab1, tab2, tab3 = st.tabs([
                    f"In both ({len(in_both)})",
                    f"Only in {file_a} ({len(only_in_a)})",
                    f"Only in {file_b} ({len(only_in_b)})",
                ])

                with tab1:
                    st.dataframe(in_both.drop(columns=["_merge"]), width="stretch", height=400)
                with tab2:
                    st.dataframe(only_in_a.drop(columns=["_merge"]), width="stretch", height=400)
                with tab3:
                    st.dataframe(only_in_b.drop(columns=["_merge"]), width="stretch", height=400)

                if st.checkbox("Highlight value differences in shared rows", key="highlight_diff"):
                    compare_cols = [c for c in common_cols if c != merge_col]
                    for col in compare_cols:
                        col_a = f"{col} ({file_a})"
                        col_b = f"{col} ({file_b})"
                        if col_a in in_both.columns and col_b in in_both.columns:
                            diff_mask = in_both[col_a].astype(str) != in_both[col_b].astype(str)
                            diff_rows = in_both[diff_mask]
                            if not diff_rows.empty:
                                st.markdown(f"**Differences in `{col}`:** {len(diff_rows)} rows")
                                st.dataframe(diff_rows[[merge_col, col_a, col_b]], width="stretch", height=min(400, 50 + 35 * len(diff_rows)))
                            else:
                                st.info(f"No differences in `{col}`")

        if st.checkbox("Show raw data side-by-side", key="raw_side"):
            c1, c2 = st.columns(2)
            with c1:
                st.markdown(f"**{file_a}** - {df_a.shape[0]} rows, {df_a.shape[1]} columns")
                st.dataframe(df_a, width="stretch", height=400)
            with c2:
                st.markdown(f"**{file_b}** - {df_b.shape[0]} rows, {df_b.shape[1]} columns")
                st.dataframe(df_b, width="stretch", height=400)

elif view_mode == "Compare Shares to ESP":
    st.header("Compare Shares (parsed_fileshares.csv) to ESP Data")
    
    shares_file = st.selectbox("Select Shares File:", ["parsed_fileshares.csv"] + [f for f in CSV_FILES if f != "parsed_fileshares.csv"])
    esp_file = st.selectbox("Select ESP File:", ["ESP_20260416_with_ID.csv"] + [f for f in CSV_FILES if f != "ESP_20260416_with_ID.csv"])
    
    if st.button("Run Comparison Tool"):
        shares_df = load_csv(shares_file)
        esp_df = load_csv(esp_file)
        
        if shares_df is not None and esp_df is not None:
            if "Server" not in shares_df.columns or "Share" not in shares_df.columns:
                st.error(f"'{shares_file}' must contain 'Server' and 'Share' columns.")
            elif "UniqueID" not in esp_df.columns:
                st.error(f"'{esp_file}' must contain a 'UniqueID' column for this comparison.")
            else:
                esp_unique_ids = esp_df["UniqueID"].dropna().astype(str).str.upper().tolist()

                shares_df = shares_df.copy()
                shares_df["ServerUpper"] = shares_df["Server"].fillna("").astype(str).str.upper()
                shares_df["ShareUpper"] = shares_df["Share"].fillna("").astype(str).str.upper()

                shares_df["ServerFound"] = shares_df["ServerUpper"].apply(
                    lambda server: any(server in uid for uid in esp_unique_ids) if server else False
                )
                shares_df["ShareFound"] = shares_df["ShareUpper"].apply(
                    lambda share: any(share in uid for uid in esp_unique_ids) if share else False
                )
                shares_df["MatchStatus"] = shares_df.apply(
                    lambda row: "Both" if row["ServerFound"] and row["ShareFound"] else "Server only" if row["ServerFound"] else "Share only" if row["ShareFound"] else "None",
                    axis=1,
                )

                matching_servers = shares_df["ServerFound"].sum()
                matching_shares = shares_df["ShareFound"].sum()
                unique_esp_uids = len(set(esp_unique_ids))

                col1, col2, col3 = st.columns(3)
                col1.metric("Rows in Shares File", len(shares_df))
                col2.metric("Unique ESP UniqueIDs", unique_esp_uids)
                col3.metric("Rows with any match", (shares_df["ServerFound"] | shares_df["ShareFound"]).sum())

                col4, col5 = st.columns(2)
                col4.metric("Server matches in UniqueID", int(matching_servers))
                col5.metric("Share matches in UniqueID", int(matching_shares))

                shares_df["MatchedUniqueID"] = shares_df.apply(
                    lambda row: ", ".join(
                        sorted({
                            uid
                            for uid in esp_unique_ids
                            if (row["ServerUpper"] and row["ServerUpper"] in uid) or (row["ShareUpper"] and row["ShareUpper"] in uid)
                        })
                    ),
                    axis=1,
                )

                esp_df = esp_df.copy()
                esp_df["UniqueIDUpper"] = esp_df["UniqueID"].astype(str).str.upper()
                esp_cols = [col for col in esp_df.columns if col != "UniqueIDUpper"]

                def aggregate_esp_values(row, esp_col):
                    server = row["ServerUpper"]
                    share = row["ShareUpper"]
                    values = []
                    for _, esp_row in esp_df.iterrows():
                        uid = esp_row["UniqueIDUpper"]
                        if (server and server in uid) or (share and share in uid):
                            values.append(str(esp_row[esp_col]))
                    return " | ".join(sorted(set(values))) if values else ""

                for col in esp_cols:
                    shares_df[f"ESP_{col}"] = shares_df.apply(lambda row, c=col: aggregate_esp_values(row, c), axis=1)

                display_cols = [
                    col for col in shares_df.columns
                    if col not in ["ServerUpper", "ShareUpper"]
                ]
                display_df = shares_df[display_cols].copy()
                display_df.insert(0, "No", range(1, len(display_df) + 1))
                display_df["ServerFound"] = display_df["ServerFound"].map({True: "Yes", False: "No"})
                display_df["ShareFound"] = display_df["ShareFound"].map({True: "Yes", False: "No"})

                def cell_color(value):
                    if value in {"Yes", "Both"}:
                        return "background-color: lightgreen;"
                    return "background-color: #ff9999;"

                headers = "".join(
                    [f"<th style='border:1px solid #ccc; padding:6px; text-align:left; background:#f2f2f2;'>{html.escape(col)}</th>" for col in display_df.columns]
                )
                rows = []
                for _, row in display_df.iterrows():
                    cells = []
                    for col in display_df.columns:
                        style = ""
                        if col in {"ServerFound", "ShareFound", "MatchStatus"}:
                            style = cell_color(row[col])
                        cells.append(
                            f"<td style='border:1px solid #ccc; padding:6px; {style}'>{html.escape(str(row[col]))}</td>"
                        )
                    rows.append(f"<tr>{''.join(cells)}</tr>")

                table_html = (
                    "<table style='border-collapse:collapse; width:100%;'>"
                    f"<thead><tr>{headers}</tr></thead>"
                    f"<tbody>{''.join(rows)}</tbody>"
                    "</table>"
                )

                st.markdown("### Comparison Results")
                st.markdown(table_html, unsafe_allow_html=True)
                st.success("Comparison completed successfully!")
st.sidebar.caption("Dashboard for viewing CMDB ESP data files")