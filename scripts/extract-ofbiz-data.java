import java.sql.*;
import java.io.*;

public class extract-ofbiz-data {
    public static void main(String[] args) {
        String dbPath = "jdbc:derby:/mnt/c/Users/Jake/OneDrive/Desktop/FlowLogic/apache-ofbiz-24.09.05/runtime/data/derby/ofbiz";

        try {
            Class.forName("org.apache.derby.jdbc.EmbeddedDriver");
            Connection conn = DriverManager.getConnection(dbPath);

            // Get inventory items
            String sql = "SELECT * FROM INVENTORY_ITEM FETCH FIRST 100 ROWS ONLY";
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(sql);

            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();

            // Print column names
            for (int i = 1; i <= cols; i++) {
                System.out.print(meta.getColumnName(i) + "\t");
            }
            System.out.println();

            // Print data
            while (rs.next()) {
                for (int i = 1; i <= cols; i++) {
                    System.out.print(rs.getString(i) + "\t");
                }
                System.out.println();
            }

            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
