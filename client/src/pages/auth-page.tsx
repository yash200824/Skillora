import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  role: z.enum(["college", "trainer"], { 
    required_error: "Please select a role" 
  }),
  organization: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "trainer",
      organization: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      console.log("Attempting login for user:", data.username);
      
      const user = await loginMutation.mutateAsync({
        username: data.username,
        password: data.password,
      });
      
      console.log("Login successful for:", user.username);
      
      // Force a query refetch to ensure user state is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      console.log("Attempting to register user:", data.username);
      
      const user = await registerMutation.mutateAsync({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        organization: data.role === "college" ? data.organization : undefined,
        skills: data.role === "trainer" && data.skills ? data.skills.split(',').map(skill => skill.trim()) : undefined,
      });
      
      console.log("Registration successful for:", data.username);
      
      // Force a query refetch to ensure user state is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}! Your account has been created successfully.`,
      });
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        if (user) window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      
      // Extract error message
      let errorMessage = "There was an error creating your account";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for common registration issues
      if (errorMessage.includes("Username already exists")) {
        errorMessage = "This username is already taken. Please choose another one.";
      } else if (errorMessage.includes("Email already exists")) {
        errorMessage = "This email is already registered. Please use another email or login.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const watchRole = registerForm.watch("role");

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-auth-pattern">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Welcome Back</h2>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <div className="text-right text-sm">
                            <a href="#" className="text-primary hover:text-primary/80">
                              Forgot password?
                            </a>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Keep me signed in</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-neutral-500">
                        New to EduConnect?
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("register")}
                    >
                      Create an Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-6">Create an Account</h2>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>I am a</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-3"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="trainer" id="trainer" />
                                <FormLabel htmlFor="trainer" className="cursor-pointer">Trainer</FormLabel>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="college" id="college" />
                                <FormLabel htmlFor="college" className="cursor-pointer">College/University</FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{watchRole === "college" ? "Institution Name" : "Full Name"}</FormLabel>
                          <FormControl>
                            <Input placeholder={watchRole === "college" ? "Enter institution name" : "Enter your full name"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchRole === "college" && (
                      <FormField
                        control={registerForm.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., University, College, Institute" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-neutral-500">
                        Already have an account?
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("login")}
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-600">
            EduConnect — Where trainers and colleges collaborate for better education.
          </p>
        </div>
      </div>
    </div>
  );
}
